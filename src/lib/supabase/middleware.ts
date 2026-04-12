import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getPublicEnv } from "@/lib/env";
import {
  ONBOARDING_COOKIE_NAME,
  ONBOARDING_COOKIE_OPTIONS,
  ONBOARDING_COOKIE_VALUE,
} from "./cookie-options";

export async function updateSession(
  request: NextRequest
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });
  const env = getPublicEnv();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // 세션 갱신 (PKCE 토큰 리프레시)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 공개 라우트 — 인증 불필요
  const publicRoutes = ["/", "/login", "/signup"];
  const publicApiPaths = ["/api/health"];
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/v1/loader/") ||
    pathname.startsWith("/api/v1/jsonld/") ||
    publicApiPaths.includes(pathname);

  // 미인증 사용자 → 보호 라우트 접근 차단
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 인증 사용자 → 로그인/회원가입 페이지 접근 시 리다이렉트
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/products";
    return NextResponse.redirect(dashboardUrl);
  }

  // API 라우트는 개별 핸들러에서 인증 처리
  // 인증 사용자 → 온보딩 미완료 시 /onboarding으로 리다이렉트
  if (user && !isPublicRoute && !pathname.startsWith("/onboarding") && !pathname.startsWith("/api/")) {
    // 온보딩 완료 여부를 쿠키로 캐싱하여 매 요청 DB 쿼리 방지.
    // 쿠키 이름/값/옵션은 `./cookie-options`에 단일 출처로 정의 — completeOnboarding
    // Server Action과 여기서 동일 구조를 사용해야 캐싱이 깨지지 않는다.
    const onboardingDone = request.cookies.get(ONBOARDING_COOKIE_NAME)?.value;

    if (onboardingDone !== ONBOARDING_COOKIE_VALUE) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || !profile.onboarding_completed) {
        const onboardingUrl = request.nextUrl.clone();
        onboardingUrl.pathname = "/onboarding";
        return NextResponse.redirect(onboardingUrl);
      }

      // 온보딩 완료 확인 후 캐싱 쿠키 set (1시간)
      supabaseResponse.cookies.set(
        ONBOARDING_COOKIE_NAME,
        ONBOARDING_COOKIE_VALUE,
        ONBOARDING_COOKIE_OPTIONS,
      );
    }
  }

  return supabaseResponse;
}
