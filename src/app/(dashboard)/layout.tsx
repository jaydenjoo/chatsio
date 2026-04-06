import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layouts/dashboard-shell";

/**
 * Dashboard 레이아웃 — 진짜 보안 경계.
 *
 * 미들웨어의 `onboarding_done` 쿠키는 빠른 UX 리다이렉트 용도(성능 최적화)이며,
 * 쿠키 조작으로 우회 가능하다. 따라서 실제 접근 제어는 이 서버 컴포넌트에서
 * 매 요청마다 DB 검증으로 수행한다.
 *
 * 검증 순서:
 * 1. 인증 사용자인가? (not null → /login)
 * 2. 온보딩을 완료했는가? (user_profiles.onboarding_completed)
 * 3. 쇼핑몰이 존재하는가? (shops row)
 */
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shop) {
    redirect("/onboarding");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
