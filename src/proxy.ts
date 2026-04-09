import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에서 세션 갱신:
     * - _next/static, _next/image (정적 파일)
     * - favicon.ico, sitemap.xml, robots.txt
     * - api/health (헬스체크 — 세션 검증 불필요)
     * - api/v1/internal (내부 전용 API — Bearer 토큰으로 자체 인증, 세션 쿠키 기반
     *   검증 우회 필요. 이 prefix는 n8n 등 외부 서비스가 호출하는 경로로 Supabase
     *   세션이 없기 때문에 middleware 통과 시 /login으로 튕긴다. Task 2-M-B-2에서
     *   E2E 검증 중 발견된 크리티컬 버그. 새 내부 API도 이 prefix 아래에 둘 것)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/health|api/v1/internal).*)",
  ],
};
