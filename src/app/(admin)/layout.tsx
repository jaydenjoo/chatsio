import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/features/admin";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Admin 레이아웃 — 진짜 보안 경계.
 *
 * 검증 순서:
 *   1. 인증 사용자인가? (not null → /login)
 *   2. user_profiles.role === 'admin'인가? (아니면 → /)
 *
 * 통과 시 Admin 전용 레이아웃(사이드바 + 메인) 렌더.
 */
export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const supabase = await createClient();

  // 1) 인증 검증
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2) admin 권한 검증 (fail-secure)
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-surface-container-low">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
