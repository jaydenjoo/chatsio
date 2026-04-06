"use server";

import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
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
      return { success: false, error: "이미 등록된 쇼핑몰 URL입니다" };
    }
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
    return { success: false, error: "온보딩 완료 처리에 실패했습니다" };
  }

  return { success: true, error: null };
}
