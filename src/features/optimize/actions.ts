"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invokeN8nWebhook } from "@/lib/n8n/client";
import { buildN8nPayload } from "@/lib/n8n/payload";
import { N8nConfigError, N8nInvocationError } from "@/lib/n8n/errors";
import {
  DUPLICATE_CHECK_WINDOW_MS,
  runOptimizationSchema,
  type OptimizationPlan as OptimizationPlanType,
  type RunOptimizationInput,
} from "./validation";

// 내부 사용 전용 — "use server" 파일은 type도 RPC로 오인할 수 있어
// 외부에 re-export하지 않는다. 외부 소비자는 validation.ts에서 가져감.
type OptimizationPlan = OptimizationPlanType;

// ============================================================
// 결과 타입
// ============================================================

export type RunOptimizationErrorCode =
  | "VALIDATION"
  | "AUTH"
  | "PERMISSION"
  | "DUPLICATE_IN_FLIGHT"
  | "N8N_FAILED"
  | "DB_FAILED";

export interface RunOptimizationResult {
  readonly success: boolean;
  readonly optimizationId?: string;
  readonly errorCode?: RunOptimizationErrorCode;
  readonly error?: string;
  /** DUPLICATE_IN_FLIGHT 시 "결과 보기" 링크용 */
  readonly duplicateOptimizationId?: string;
}

// ============================================================
// Server Action — runOptimization
// ============================================================

/**
 * 최적화 실행 — Task 2-3 Plan v3 비동기 패턴.
 *
 * 흐름:
 *   1. Zod 검증 + 인증 + shop/product 소유권 검증
 *   2. 5분 중복 체크 → 진행 중인 row 있으면 DUPLICATE_IN_FLIGHT
 *   3. crypto.randomUUID() → optimizations row INSERT (status='queued')
 *   4. invokeN8nWebhook (10초 타임아웃, n8n은 Immediately 모드라 1~3초 반환)
 *   5. 성공 → { success, optimizationId } → 클라이언트가 /optimizations/[id]로 redirect
 *   6. 실패 → row를 status='failed'로 UPDATE + userMessage 반환
 *
 * 주의 — DB row INSERT는 n8n 호출 전에 먼저 한다. 이유:
 *   - n8n 워크플로우는 idempotency_key로 기존 row를 UPDATE (Task 2-3 변환)
 *   - 이 row가 없으면 n8n UPDATE가 0 rows affected가 되어 결과가 사라짐
 *   - UNIQUE(idempotency_key) 제약이 race condition을 차단
 */
export async function runOptimization(
  input: RunOptimizationInput,
): Promise<RunOptimizationResult> {
  // ---- 1. 입력 검증 ----
  const parsed = runOptimizationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      errorCode: "VALIDATION",
      error: parsed.error.issues[0]?.message ?? "잘못된 입력입니다",
    };
  }
  const { productId, plan } = parsed.data;

  // ---- 2. 인증 + shop 소유권 ----
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, errorCode: "AUTH", error: "인증이 필요합니다." };
  }

  // M2 — 트랜지언트 에러 구분: data가 없어도 error가 있으면 "쇼핑몰 없음"이
  // 아닌 시스템 에러로 처리.
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id, industry")
    .eq("user_id", user.id)
    .maybeSingle();

  if (shopError) {
    console.error("[runOptimization] shops query failed", {
      userId: user.id,
      message: shopError.message,
    });
    return {
      success: false,
      errorCode: "DB_FAILED",
      error: "쇼핑몰 정보를 조회하지 못했습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  if (!shop) {
    return {
      success: false,
      errorCode: "AUTH",
      error: "쇼핑몰 정보가 없습니다. 온보딩을 먼저 완료해주세요.",
    };
  }

  // ---- 3. product 소유권 재검증 + 필드 로드 ----
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, url, image_urls, source, shop_id")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    console.error("[runOptimization] products query failed", {
      productId,
      message: productError.message,
    });
    return {
      success: false,
      errorCode: "DB_FAILED",
      error: "상품 정보를 조회하지 못했습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  if (!product) {
    return {
      success: false,
      errorCode: "PERMISSION",
      error: "상품을 찾을 수 없습니다.",
    };
  }

  if (product.shop_id !== shop.id) {
    return {
      success: false,
      errorCode: "PERMISSION",
      error: "이 상품에 접근할 권한이 없습니다.",
    };
  }

  // ---- 4. 5분 중복 체크 (UX용 선제 안내) ----
  // 참고 — 이 체크는 race condition을 완전히 막지 못한다. 실제 원자적
  // 차단은 DB partial unique index(migration 005)가 담당한다. 여기서는
  // "진행 중인 row가 이미 있으면 예쁜 다이얼로그로 안내"하는 용도.
  const windowStart = new Date(
    Date.now() - DUPLICATE_CHECK_WINDOW_MS,
  ).toISOString();

  const { data: duplicates, error: duplicateQueryError } = await supabase
    .from("optimizations")
    .select("id")
    .eq("product_id", productId)
    .eq("plan", plan)
    .in("status", ["queued", "processing"])
    .gte("created_at", windowStart)
    .order("created_at", { ascending: false })
    .limit(1);

  if (duplicateQueryError) {
    console.error("[runOptimization] duplicate query failed", {
      productId,
      message: duplicateQueryError.message,
    });
    // 쿼리 실패 시 UX 안내를 포기하고 INSERT를 시도한다. DB partial
    // unique index가 race 방어의 최종 수단이므로 여기서 리턴하지 않는다.
  }

  if (duplicates && duplicates.length > 0) {
    return {
      success: false,
      errorCode: "DUPLICATE_IN_FLIGHT",
      error: "이 상품의 최적화가 이미 진행 중입니다.",
      duplicateOptimizationId: duplicates[0].id,
    };
  }

  // ---- 5. idempotency_key + row INSERT (status='queued') ----
  const idempotencyKey = crypto.randomUUID();

  const { data: inserted, error: insertError } = await supabase
    .from("optimizations")
    .insert({
      product_id: productId,
      shop_id: shop.id,
      plan,
      status: "queued",
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    // H2 — migration 005의 partial unique index를 위반한 경우
    // Postgres unique_violation 코드 "23505"로 돌아온다. 이 경우 race
    // condition으로 누군가 직전에 진입했다는 뜻이므로 DUPLICATE_IN_FLIGHT
    // 응답으로 사용자를 진행 중인 row로 안내한다.
    if (insertError?.code === "23505") {
      const { data: recent } = await supabase
        .from("optimizations")
        .select("id")
        .eq("product_id", productId)
        .eq("plan", plan)
        .in("status", ["queued", "processing"])
        .order("created_at", { ascending: false })
        .limit(1);

      return {
        success: false,
        errorCode: "DUPLICATE_IN_FLIGHT",
        error: "이 상품의 최적화가 이미 진행 중입니다.",
        duplicateOptimizationId: recent?.[0]?.id,
      };
    }

    console.error("[runOptimization] insert failed", {
      productId,
      plan,
      message: insertError?.message,
    });
    return {
      success: false,
      errorCode: "DB_FAILED",
      error: "최적화 요청 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  const optimizationId = inserted.id;

  // ---- 6. n8n webhook 호출 ----
  try {
    await invokeN8nWebhook(
      buildN8nPayload({
        idempotencyKey,
        plan,
        product: {
          id: product.id,
          name: product.name,
          url: product.url,
          imageUrls: product.image_urls,
          source: product.source,
        },
        shop: { id: shop.id, industry: shop.industry },
      }),
    );
  } catch (err) {
    return await markOptimizationFailed({
      supabase,
      optimizationId,
      error: err,
    });
  }

  // ---- 7. 성공 ----
  revalidatePath("/optimizations");
  return { success: true, optimizationId };
}

// ============================================================
// Helper — 실패 마킹
// ============================================================

interface MarkFailedInput {
  readonly supabase: Awaited<ReturnType<typeof createClient>>;
  readonly optimizationId: string;
  readonly error: unknown;
}

/**
 * M1 — DB 저장 메시지와 UI 노출 메시지 분리.
 *
 * 과거 설계: rawMessage(Postgres 스키마/constraint 이름 포함 가능)를
 * DB `error_message`에 저장하고 FailedView가 그대로 노출 → 스키마 누설.
 *
 * 수정: DB `error_message`에는 **사용자 안전 메시지(userMessage)** 만
 * 저장. 원본 rawMessage는 서버 콘솔/모니터링(Task 2-M pipeline_events)
 * 전용으로 기록. FailedView는 DB에서 읽어 그대로 표시해도 안전.
 */
async function markOptimizationFailed(
  input: MarkFailedInput,
): Promise<RunOptimizationResult> {
  const { supabase, optimizationId, error } = input;

  const errorStep =
    error instanceof N8nInvocationError ? error.step : "unknown";

  // rawMessage는 서버 로그 전용 — 절대 DB/UI에 직접 노출하지 않는다
  const rawMessage =
    error instanceof Error ? error.message : String(error);

  // userMessage는 DB에 저장해도, 화면에 보여줘도 안전한 한국어 메시지
  const userMessage =
    error instanceof N8nInvocationError || error instanceof N8nConfigError
      ? error.userMessage
      : "최적화 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

  const { error: updateError } = await supabase
    .from("optimizations")
    .update({
      status: "failed",
      error_step: errorStep,
      // 사용자 안전 메시지만 DB에 저장 — FailedView가 그대로 노출해도 OK
      error_message: userMessage.slice(0, 500),
      failed_at: new Date().toISOString(),
    })
    .eq("id", optimizationId);

  if (updateError) {
    console.error("[runOptimization] failed-mark UPDATE failed", {
      optimizationId,
      cause: updateError.message,
    });
  }

  // rawMessage는 서버 로그에만 — Task 2-M에서 pipeline_events로 확장
  console.error("[runOptimization] n8n invocation failed", {
    optimizationId,
    errorStep,
    rawMessage: rawMessage.slice(0, 500),
  });

  return {
    success: false,
    errorCode: "N8N_FAILED",
    error: userMessage,
  };
}

// ============================================================
// Read helpers — 페이지용
// ============================================================

export interface OptimizationProductCard {
  readonly id: string;
  readonly name: string;
  readonly url: string | null;
  readonly imageUrls: string[] | null;
  readonly status: string;
  readonly createdAt: string;
}

export interface GetOptimizationProductsResult {
  readonly success: boolean;
  readonly error: string | null;
  readonly products: OptimizationProductCard[];
  readonly preselectedProductId: string | null;
}

/**
 * /optimizations/new 페이지에서 사용 — 본인 쇼핑몰의 상품 목록.
 * 기존 getProducts와 달리 KPI/페이지네이션/검색 없이 전체 반환.
 */
export async function getOptimizationProducts(
  preselectedProductId?: string,
): Promise<GetOptimizationProductsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "인증이 필요합니다.",
      products: [],
      preselectedProductId: null,
    };
  }

  // M2 — 트랜지언트 에러를 "쇼핑몰 없음"과 구분
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (shopError) {
    console.error("[getOptimizationProducts] shops query failed", {
      userId: user.id,
      message: shopError.message,
    });
    return {
      success: false,
      error: "쇼핑몰 정보를 조회하지 못했습니다. 잠시 후 다시 시도해주세요.",
      products: [],
      preselectedProductId: null,
    };
  }

  if (!shop) {
    return {
      success: false,
      error: "쇼핑몰 정보가 없습니다.",
      products: [],
      preselectedProductId: null,
    };
  }

  const { data: rows, error } = await supabase
    .from("products")
    .select("id, name, url, image_urls, status, created_at")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return {
      success: false,
      error: "상품 목록을 불러오지 못했습니다.",
      products: [],
      preselectedProductId: null,
    };
  }

  interface ProductRowShape {
    id: string;
    name: string;
    url: string | null;
    image_urls: string[] | null;
    status: string;
    created_at: string;
  }

  const products: OptimizationProductCard[] = (
    (rows ?? []) as ProductRowShape[]
  ).map((row) => ({
    id: row.id,
    name: row.name,
    url: row.url,
    imageUrls: row.image_urls,
    status: row.status,
    createdAt: row.created_at,
  }));

  // preselectedProductId가 유효한지 검증 (내 상품에 포함되는지)
  const validPreselected =
    preselectedProductId && products.some((p) => p.id === preselectedProductId)
      ? preselectedProductId
      : null;

  return {
    success: true,
    error: null,
    products,
    preselectedProductId: validPreselected,
  };
}

// ============================================================
// /optimize/[id] 페이지용 Read actions
// ============================================================

export interface OptimizationDetail {
  readonly id: string;
  readonly productId: string;
  readonly shopId: string;
  readonly plan: OptimizationPlan;
  readonly status: "queued" | "processing" | "completed" | "failed";
  readonly idempotencyKey: string;
  readonly resultJson: Record<string, unknown> | null;
  readonly jsonld: Record<string, unknown> | null;
  readonly score: number | null;
  readonly processingStep: number | null;
  readonly errorStep: string | null;
  readonly errorMessage: string | null;
  readonly failedAt: string | null;
  readonly durationMs: number | null;
  readonly retryCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly product: {
    readonly id: string;
    readonly name: string;
    readonly url: string | null;
    readonly imageUrls: string[] | null;
  } | null;
}

export interface GetOptimizationResult {
  readonly success: boolean;
  readonly error: string | null;
  readonly optimization: OptimizationDetail | null;
}

interface OptimizationRowShape {
  id: string;
  product_id: string;
  shop_id: string;
  plan: OptimizationPlan;
  status: "queued" | "processing" | "completed" | "failed";
  idempotency_key: string;
  result_json: Record<string, unknown> | null;
  jsonld: Record<string, unknown> | null;
  score: number | null;
  processing_step: number | null;
  error_step: string | null;
  error_message: string | null;
  failed_at: string | null;
  duration_ms: number | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
  products: {
    id: string;
    name: string;
    url: string | null;
    image_urls: string[] | null;
  } | null;
}

/**
 * optimization 단일 행 조회 — `/optimize/[id]` 페이지와 폴링에서 공용.
 * RLS가 shop_id 기반 소유권을 자동으로 검증한다.
 */
export async function getOptimization(
  optimizationId: string,
): Promise<GetOptimizationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "인증이 필요합니다.",
      optimization: null,
    };
  }

  const { data: row, error } = await supabase
    .from("optimizations")
    .select(
      `
      id, product_id, shop_id, plan, status, idempotency_key,
      result_json, jsonld, score,
      processing_step, error_step, error_message, failed_at,
      duration_ms, retry_count, created_at, updated_at,
      products (id, name, url, image_urls)
    `,
    )
    .eq("id", optimizationId)
    .maybeSingle();

  if (error) {
    return {
      success: false,
      error: "최적화 정보를 불러오지 못했습니다.",
      optimization: null,
    };
  }

  if (!row) {
    return {
      success: false,
      error: "최적화를 찾을 수 없거나 접근 권한이 없습니다.",
      optimization: null,
    };
  }

  // Supabase는 products를 배열 또는 단일 객체로 반환 — select 구문에 따라 다름
  const typed = row as unknown as OptimizationRowShape;
  const productRaw = Array.isArray(typed.products)
    ? (typed.products[0] ?? null)
    : typed.products;

  const optimization: OptimizationDetail = {
    id: typed.id,
    productId: typed.product_id,
    shopId: typed.shop_id,
    plan: typed.plan,
    status: typed.status,
    idempotencyKey: typed.idempotency_key,
    resultJson: typed.result_json,
    jsonld: typed.jsonld,
    score: typed.score,
    processingStep: typed.processing_step,
    errorStep: typed.error_step,
    errorMessage: typed.error_message,
    failedAt: typed.failed_at,
    durationMs: typed.duration_ms,
    retryCount: typed.retry_count,
    createdAt: typed.created_at,
    updatedAt: typed.updated_at,
    product: productRaw
      ? {
          id: productRaw.id,
          name: productRaw.name,
          url: productRaw.url,
          imageUrls: productRaw.image_urls,
        }
      : null,
  };

  return { success: true, error: null, optimization };
}

