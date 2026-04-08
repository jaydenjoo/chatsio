import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin 레이아웃 — 진짜 보안 경계.
 *
 * Task 2-M-B-1에서 추가. 그 전까지는 RBAC 0줄이라 로그인한 누구나
 * `/admin/*` 6개 페이지에 접근 가능했음(🔴 보안 등급 프로젝트).
 *
 * `(dashboard)/layout.tsx`와 동일 패턴:
 *   - async Server Component
 *   - 매 요청 DB 검증 (쿠키 캐싱 아님)
 *   - console.error fail-secure (auth/db 에러도 안전 측 redirect)
 *
 * 검증 순서:
 *   1. 인증 사용자인가? (not null → /login)
 *   2. user_profiles.role === 'admin'인가? (아니면 → /)
 *
 * 통과 시 기존 Admin 전용 레이아웃(사이드바 + 메인)을 그대로 렌더.
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

  if (authError) {
    console.error("[AdminLayout] auth.getUser failed:", authError.message);
  }

  if (!user) {
    redirect("/login");
  }

  // 2) admin 권한 검증
  // fail-secure: DB 에러 시에도 profile은 null → 아래 조건에서 redirect
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "[AdminLayout] user_profiles query failed:",
      profileError.message,
    );
  }

  // null-path를 명시적으로 표기 — 읽는 사람이 fail-secure 의도를
  // optional chain에서 추론할 필요 없도록.
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      {/* TODO: Task 4-2에서 어드민 전용 사이드바 구현 */}
      <aside className="hidden w-60 shrink-0 bg-inverse-surface lg:block">
        <div className="p-6">
          <span className="text-subtitle text-inverse-on-surface">Admin</span>
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
