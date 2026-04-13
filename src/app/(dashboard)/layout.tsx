import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layouts/dashboard-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

  // 1) 인증 검증
  // authError는 Supabase Auth 서비스 장애 시 발생한다.
  // 현재는 fail-secure (→ /login) 동작을 유지하되, 원인 추적을 위해 로깅한다.
  // 프로덕션에서는 모니터링/알림으로 승격할 것.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[DashboardLayout] auth.getUser failed:", authError.message);
  }

  if (!user) {
    redirect("/login");
  }

  // 2) 온보딩 완료 여부 검증
  // profileError는 DB 트랜지언트 장애 시 발생한다.
  // fail-secure 유지: 에러 시에도 `profile`은 null이 되어 /onboarding으로 리다이렉트.
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "[DashboardLayout] user_profiles query failed:",
      profileError.message,
    );
  }

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  // 3) 쇼핑몰 존재 검증
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (shopError) {
    console.error(
      "[DashboardLayout] shops query failed:",
      shopError.message,
    );
  }

  if (!shop) {
    redirect("/onboarding");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
