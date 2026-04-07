import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Onboarding 레이아웃 — (dashboard)와 분리된 별도 라우트 그룹.
 *
 * (dashboard)/layout.tsx가 미완료 유저를 /onboarding으로 리다이렉트하는데,
 * /onboarding을 같은 라우트 그룹에 두면 layout이 재실행되어 같은 조건에
 * 다시 걸려 무한 리다이렉트가 발생한다. 따라서 라우트 그룹을 분리한다.
 *
 * 책임:
 * 1. 인증 검증 (fail-safe — middleware가 1차로 처리하지만 한 번 더)
 * 2. 이미 온보딩 완료 유저(profile.onboarding_completed && shop 존재)는
 *    /products로 리다이렉트 → 재진입 차단
 * 3. DashboardShell을 입히지 않음 → 사이드바 없는 풀화면 온보딩 UX
 */
export default async function OnboardingLayout({
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

  if (authError) {
    console.error(
      "[OnboardingLayout] auth.getUser failed:",
      authError.message,
    );
  }

  if (!user) {
    redirect("/login");
  }

  // 2) 이미 완전히 온보딩한 유저는 /products로 (재진입 차단)
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "[OnboardingLayout] user_profiles query failed:",
      profileError.message,
    );
  }

  if (profile?.onboarding_completed) {
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (shopError) {
      console.error(
        "[OnboardingLayout] shops query failed:",
        shopError.message,
      );
    }

    if (shop) {
      redirect("/products");
    }
    // shop이 없는 경우(onboarding_completed=true이지만 shops 행 없음):
    // (dashboard)/layout이 /onboarding으로 보낸 데이터 불일치 케이스다.
    // 온보딩을 처음부터(step 0) 다시 수행하도록 의도적으로 fallthrough.
  }

  return <>{children}</>;
}
