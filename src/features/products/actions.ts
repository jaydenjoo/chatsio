"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  BULK_MAX_ROWS,
  BULK_MAX_NAME,
  BULK_MAX_URL,
  hasFormulaInjection,
} from "./validation";

// ============================================================
// Types
// ============================================================

export interface ProductRow {
  id: string;
  name: string;
  url: string | null;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ProductKpi {
  total: number;
  optimized: number;
  thisWeek: number;
  manualReview: number;
}

export interface GetProductsResult {
  success: boolean;
  error: string | null;
  products: ProductRow[];
  total: number;
  kpi: ProductKpi;
}

// ============================================================
// Zod 스키마
// ============================================================

const getProductsSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["all", "pending", "optimized", "failed", "manual_review"]).optional(),
  sort: z.enum(["newest", "oldest", "name"]).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type GetProductsInput = z.infer<typeof getProductsSchema>;

const createProductSchema = z.object({
  name: z.string().min(1, "상품명을 입력해주세요").max(200, "상품명은 200자 이하로 입력해주세요"),
  url: z
    .string()
    .url("올바른 상품 URL을 입력해주세요")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "http:// 또는 https:// URL만 허용됩니다",
    ),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export interface CreateProductResult {
  success: boolean;
  error: string | null;
  productId?: string;
}

// ============================================================
// 벌크 등록 (CSV) — 스키마 + 결과 타입
// ============================================================
// 상수 및 hasFormulaInjection은 ./validation에서 import (서버/클라이언트 공유)

const bulkRowSchema = z.object({
  name: z
    .string()
    .min(1, "상품명이 비어있습니다")
    .max(BULK_MAX_NAME, `상품명은 ${BULK_MAX_NAME}자 이하여야 합니다`)
    .refine((s) => !hasFormulaInjection(s), "상품명에 허용되지 않은 문자가 있습니다"),
  url: z
    .string()
    .min(1, "URL이 비어있습니다")
    .max(BULK_MAX_URL, `URL은 ${BULK_MAX_URL}자 이하여야 합니다`)
    .refine((s) => !hasFormulaInjection(s), "URL에 허용되지 않은 문자가 있습니다")
    .refine(
      (s) => s.startsWith("http://") || s.startsWith("https://"),
      "http:// 또는 https:// URL만 허용됩니다",
    )
    .refine((s) => {
      try {
        new URL(s);
        return true;
      } catch {
        return false;
      }
    }, "올바른 URL 형식이 아닙니다"),
});

// 타입가드 — `as` 캐스팅 대신 명시적 검사 (learnings.md "as 캐스팅 지양")
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// 액션 입력은 배열 길이만 1차 검증. 행별 검증은 액션 내부에서
// bulkRowSchema로 별도 수행 (부분 실패 추적을 위해).
const createProductsBulkSchema = z.object({
  rows: z
    .array(z.unknown())
    .min(1, "등록할 행이 없습니다")
    .max(BULK_MAX_ROWS, `한 번에 ${BULK_MAX_ROWS}행까지만 등록할 수 있습니다`),
});

export interface BulkRowInput {
  name: string;
  url: string;
}

export interface BulkFailedRow {
  row: number;
  name: string;
  url: string;
  message: string;
}

export interface CreateProductsBulkResult {
  success: boolean;
  error: string | null;
  successCount: number;
  failedRows: BulkFailedRow[];
}

// ============================================================
// Server Actions
// ============================================================

export async function getProducts(
  input?: GetProductsInput,
): Promise<GetProductsResult> {
  const parsed = getProductsSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return {
      success: false,
      error: "잘못된 요청입니다.",
      products: [],
      total: 0,
      kpi: { total: 0, optimized: 0, thisWeek: 0, manualReview: 0 },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "인증이 필요합니다.",
      products: [],
      total: 0,
      kpi: { total: 0, optimized: 0, thisWeek: 0, manualReview: 0 },
    };
  }

  // 현재 유저의 shop 조회
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shop) {
    return {
      success: true,
      error: null,
      products: [],
      total: 0,
      kpi: { total: 0, optimized: 0, thisWeek: 0, manualReview: 0 },
    };
  }

  const { query, status, sort, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  // KPI 쿼리 (전체 상품 기준)
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, status, created_at")
    .eq("shop_id", shop.id);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const items = allProducts ?? [];
  const kpi: ProductKpi = {
    total: items.length,
    optimized: items.filter((p: { status: string }) => p.status === "optimized").length,
    thisWeek: items.filter((p: { created_at: string }) => new Date(p.created_at) >= weekAgo).length,
    manualReview: items.filter((p: { status: string }) => p.status === "manual_review").length,
  };

  // 목록 쿼리 (필터 + 검색 + 정렬 + 페이지네이션)
  let listQuery = supabase
    .from("products")
    .select("id, name, url, status, source, created_at, updated_at", { count: "exact" })
    .eq("shop_id", shop.id);

  // 검색 — LIKE 와일드카드 이스케이프 + PostgREST OR-list 구분자(`,`) 제거
  // 이유: `.or()`의 조건 구분자는 `,` 하나뿐이다. `(` `)` `.`는 PostgREST
  // 문법상 값 위치에서 리터럴로 취급되므로 그대로 둔다. 한국 상품명에
  // 흔히 포함되는 "ABC Co., Ltd.", "나이키(운동화)", "1.5L 생수" 같은
  // 검색어의 의도를 보존하기 위함. `shop_id` .eq 체인 + RLS로 실질 공격
  // 표면은 닫혀 있다.
  if (query) {
    const safeQuery = query
      .replace(/[\\%_]/g, "\\$&") // LIKE wildcards: %, _, \
      .replace(/,/g, ""); // PostgREST .or() separator
    if (safeQuery) {
      listQuery = listQuery.or(
        `name.ilike.%${safeQuery}%,url.ilike.%${safeQuery}%`,
      );
    }
  }

  // 상태 필터
  if (status && status !== "all") {
    listQuery = listQuery.eq("status", status);
  }

  // 정렬
  switch (sort) {
    case "oldest":
      listQuery = listQuery.order("created_at", { ascending: true });
      break;
    case "name":
      listQuery = listQuery.order("name", { ascending: true });
      break;
    default:
      listQuery = listQuery.order("created_at", { ascending: false });
  }

  // 페이지네이션
  listQuery = listQuery.range(offset, offset + limit - 1);

  const { data: products, count, error } = await listQuery;

  if (error) {
    return {
      success: false,
      error: "상품 목록을 불러오는데 실패했습니다.",
      products: [],
      total: 0,
      kpi,
    };
  }

  return {
    success: true,
    error: null,
    products: (products as ProductRow[]) ?? [],
    total: count ?? 0,
    kpi,
  };
}

export async function createProduct(
  input: CreateProductInput,
): Promise<CreateProductResult> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "잘못된 요청입니다.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "인증이 필요합니다." };
  }

  // 현재 유저의 shop 조회 (온보딩 완료 여부)
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shop) {
    return { success: false, error: "쇼핑몰 정보가 없습니다. 온보딩을 먼저 완료해주세요." };
  }

  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      shop_id: shop.id,
      name: parsed.data.name,
      url: parsed.data.url,
      source: "url",
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: "상품 등록에 실패했습니다." };
  }

  revalidatePath("/products");

  return { success: true, error: null, productId: inserted.id };
}

export async function createProductsBulk(
  rawRows: unknown[],
): Promise<CreateProductsBulkResult> {
  // 1. 배열 길이 1차 검증
  const parsed = createProductsBulkSchema.safeParse({ rows: rawRows });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "잘못된 요청입니다.",
      successCount: 0,
      failedRows: [],
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "인증이 필요합니다.",
      successCount: 0,
      failedRows: [],
    };
  }

  // 2. shop 소유권 검증 (1회)
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shop) {
    return {
      success: false,
      error: "쇼핑몰 정보가 없습니다. 온보딩을 먼저 완료해주세요.",
      successCount: 0,
      failedRows: [],
    };
  }

  // 3. 행별 검증 — 통과한 행은 insert 큐에, 실패한 행은 failedRows에
  const failedRows: BulkFailedRow[] = [];
  const validRows: { row: number; data: BulkRowInput }[] = [];

  parsed.data.rows.forEach((raw, index) => {
    const rowNumber = index + 1; // 사용자 표시용 1-based
    const result = bulkRowSchema.safeParse(raw);
    if (!result.success) {
      // raw에서 표시용 name/url 추출 (검증 실패해도 사용자에게 보여줌)
      const rawObj = isRecord(raw) ? raw : {};
      const displayName = typeof rawObj.name === "string" ? rawObj.name.slice(0, 80) : "";
      const displayUrl = typeof rawObj.url === "string" ? rawObj.url.slice(0, 120) : "";
      failedRows.push({
        row: rowNumber,
        name: displayName,
        url: displayUrl,
        message: result.error.issues[0]?.message ?? "검증 실패",
      });
      return;
    }
    validRows.push({ row: rowNumber, data: result.data });
  });

  // 4. 검증 통과 행을 단일 배열 insert (쿼리 1회 — DoS 표면 축소)
  //    Zod로 사전 검증했으므로 DB 에러는 드물지만, 발생 시 전체 실패로 본다.
  //    (부분 성공 추적은 검증 단계에서 끝남)
  let successCount = 0;
  if (validRows.length > 0) {
    const rowsToInsert = validRows.map(({ data }) => ({
      shop_id: shop.id,
      name: data.name,
      url: data.url,
      source: "csv" as const,
      status: "pending" as const,
    }));

    const { error: bulkInsertError } = await supabase
      .from("products")
      .insert(rowsToInsert);

    if (bulkInsertError) {
      // 전체 실패 — 모든 validRows를 failedRows로 이동
      for (const { row, data } of validRows) {
        failedRows.push({
          row,
          name: data.name,
          url: data.url,
          message: "DB 등록 실패",
        });
      }
    } else {
      successCount = validRows.length;
      revalidatePath("/products");
    }
  }

  return {
    success: successCount > 0 || failedRows.length === 0,
    error: null,
    successCount,
    failedRows,
  };
}

export async function deleteProduct(productId: string): Promise<{ success: boolean; error: string | null }> {
  if (!productId) {
    return { success: false, error: "상품 ID가 필요합니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "인증이 필요합니다." };
  }

  // 소유권 검증: product → shop → user_id
  const { data: product } = await supabase
    .from("products")
    .select("id, shop_id")
    .eq("id", productId)
    .maybeSingle();

  if (!product) {
    return { success: false, error: "상품을 찾을 수 없습니다." };
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("id", product.shop_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shop) {
    return { success: false, error: "상품을 삭제할 권한이 없습니다." };
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return { success: false, error: "상품 삭제에 실패했습니다." };
  }

  revalidatePath("/products");

  return { success: true, error: null };
}
