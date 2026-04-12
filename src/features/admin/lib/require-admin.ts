import { createClient } from "@/lib/supabase/server";

export interface AdminContext {
  readonly supabase: Awaited<ReturnType<typeof createClient>>;
  readonly userId: string;
}

interface AdminResult {
  readonly success: boolean;
  readonly error?: string;
  readonly ctx?: AdminContext;
}

/** admin 인증 확인 — 모든 admin Server Action에서 공통 사용 */
export async function requireAdmin(): Promise<AdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "관리자 권한이 필요합니다." };
  }

  return { success: true, ctx: { supabase, userId: user.id } };
}
