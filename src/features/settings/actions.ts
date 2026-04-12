"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// 타입
// ============================================================

export interface SettingsData {
  readonly profile: {
    readonly fullName: string | null;
    readonly email: string;
  };
  readonly shop: {
    readonly id: string;
    readonly name: string;
    readonly url: string;
    readonly industry: string;
  } | null;
}

export interface GetSettingsResult {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: SettingsData;
}

export interface UpdateSettingsResult {
  readonly success: boolean;
  readonly error?: string;
}

// ============================================================
// Zod 스키마
// ============================================================

const INDUSTRIES = ["clothing", "food", "furniture", "other"] as const;

const updateProfileSchema = z.object({
  fullName: z.string().min(1, "이름을 입력해주세요").max(100),
});

const updateShopSchema = z.object({
  name: z.string().min(1, "쇼핑몰 이름을 입력해주세요").max(200),
  url: z.string().url("올바른 URL을 입력해주세요"),
  industry: z.enum(INDUSTRIES),
});

// ============================================================
// Server Actions
// ============================================================

export async function getSettings(): Promise<GetSettingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, url, industry")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return {
    success: true,
    data: {
      profile: {
        fullName: profile?.full_name ?? null,
        email: user.email ?? "",
      },
      shop: shop
        ? {
            id: shop.id,
            name: shop.name,
            url: shop.url,
            industry: shop.industry,
          }
        : null,
    },
  };
}

export async function updateProfile(
  input: unknown,
): Promise<UpdateSettingsResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "이름을 올바르게 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "프로필 저장에 실패했습니다." };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateShop(
  input: unknown,
): Promise<UpdateSettingsResult> {
  const parsed = updateShopSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "쇼핑몰 정보를 올바르게 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("shops")
    .update({
      name: parsed.data.name,
      url: parsed.data.url,
      industry: parsed.data.industry,
    })
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "쇼핑몰 정보 저장에 실패했습니다." };
  }

  revalidatePath("/settings");
  return { success: true };
}
