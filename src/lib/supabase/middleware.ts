import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getPublicEnv } from "@/lib/env";

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
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/");

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

  return supabaseResponse;
}
