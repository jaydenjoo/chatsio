"use server";

import { cookies } from "next/headers";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import {
  ONBOARDING_COOKIE_NAME,
  ONBOARDING_COOKIE_OPTIONS,
  ONBOARDING_COOKIE_VALUE,
} from "@/lib/supabase/cookie-options";
import { logEvent } from "@/lib/monitoring/log-event";
import { shopPlatformEnum, industryEnum } from "@/lib/db/schema/enums";

// ============================================================
// Zod 스키마
// ============================================================

const shopInfoSchema = z.object({
  name: z.string().min(1, "쇼핑몰 이름을 입력해주세요").max(100),
  url: z.string().url("올바른 URL을 입력해주세요"),
  platform: z.enum(shopPlatformEnum.enumValues),
  industry: z.enum(industryEnum.enumValues),
});

const firstProductSchema = z.object({
  name: z.string().min(1, "상품명을 입력해주세요").max(200),
  url: z
    .string()
    .url("올바른 상품 URL을 입력해주세요")
    .optional()
    .or(z.literal("")),
});

// ============================================================
// 타입
// ============================================================

export type ShopInfoInput = z.infer<typeof shopInfoSchema>;
export type FirstProductInput = z.infer<typeof firstProductSchema>;

interface ActionResult {
  success: boolean;
  error: string | null;
  shopId?: string;
}

// ============================================================
// Server Actions
// ============================================================

export async function createShop(input: ShopInfoInput): Promise<ActionResult> {
  const parsed = shopInfoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "인증이 필요합니다" };
  }

  const { data, error } = await supabase
    .from("shops")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      url: parsed.data.url,
      platform: parsed.data.platform,
      industry: parsed.data.industry,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      void logEvent({
        service: "next-app",
        level: "warn",
        step: "shop_create_duplicate_url",
        contextType: "onboarding",
        message: "createShop 실패 — 중복 쇼핑몰 URL (unique violation 23505)",
        userId: user.id,
      });
      return { success: false, error: "이미 등록된 쇼핑몰 URL입니다" };
    }
    void logEvent({
      service: "next-app",
      level: "error",
      step: "shop_create_insert",
      contextType: "onboarding",
      message: `createShop INSERT 실패: ${error.message}`,
      userId: user.id,
    });
    return { success: false, error: "쇼핑몰 등록에 실패했습니다" };
  }

  return { success: true, error: null, shopId: data.id };
}

export async function addFirstProduct(
  shopId: string,
  input: FirstProductInput
): Promise<ActionResult> {
  const parsed = firstProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "인증이 필요합니다" };
  }

  // shopId 소유권 검증 (IDOR 방지)
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id")
    .eq("id", shopId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (shopError || !shop) {
    // 🔴 IDOR 시도 감지 — 다른 유저의 shopId로 addFirstProduct 호출.
    // shopError(쿼리 에러)와 !shop(존재하지 않음/소유권 없음)을 구분 불가능한
    // 기존 구조 그대로. 둘 다 warn으로 기록 — 실제 보안 공격은 !shop 경로.
    void logEvent({
      service: "next-app",
      level: "warn",
      step: "first_product_shop_not_found",
      contextType: "onboarding",
      contextId: shopId,
      message: shopError
        ? `addFirstProduct shop 조회 에러: ${shopError.message}`
        : "addFirstProduct 소유권 거부 — 다른 유저의 shopId로 호출",
      userId: user.id,
    });
    return { success: false, error: "쇼핑몰을 찾을 수 없습니다" };
  }

  const { error } = await supabase.from("products").insert({
    shop_id: shopId,
    name: parsed.data.name,
    url: parsed.data.url || null,
    source: "url",
    status: "pending",
  });

  if (error) {
    void logEvent({
      service: "next-app",
      level: "error",
      step: "first_product_insert",
      contextType: "onboarding",
      message: `addFirstProduct INSERT 실패: ${error.message}`,
      userId: user.id,
      shopId,
    });
    return { success: false, error: "상품 등록에 실패했습니다" };
  }

  return { success: true, error: null };
}

export async function completeOnboarding(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "인증이 필요합니다" };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  if (error) {
    void logEvent({
      service: "next-app",
      level: "error",
      step: "onboarding_complete_update",
      contextType: "onboarding",
      message: `completeOnboarding UPDATE 실패: ${error.message}`,
      userId: user.id,
    });
    return { success: false, error: "온보딩 완료 처리에 실패했습니다" };
  }

  // 미들웨어가 다음 요청에서 DB 재조회하지 않도록 캐싱 쿠키 set.
  // 쿠키 이름/값/옵션은 `@/lib/supabase/cookie-options`에 단일 출처로 정의 —
  // middleware > updateSession()과 여기서 동일 구조를 사용해야 캐싱이 유지된다.
  // 보안 경계가 아닌 UX 캐싱용 — 실제 접근 제어는 (dashboard)/layout.tsx에서
  // 매 요청 DB 검증.
  const cookieStore = await cookies();
  cookieStore.set(
    ONBOARDING_COOKIE_NAME,
    ONBOARDING_COOKIE_VALUE,
    ONBOARDING_COOKIE_OPTIONS,
  );

  return { success: true, error: null };
}
