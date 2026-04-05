import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에서 세션 갱신:
     * - _next/static, _next/image (정적 파일)
     * - favicon.ico, sitemap.xml, robots.txt
     * - api/health (헬스체크)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/health).*)",
  ],
};
