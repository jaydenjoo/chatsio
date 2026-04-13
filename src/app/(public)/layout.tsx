import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <>
      {children}
    </>
  );
}

/**
 * 서브페이지용 래퍼 — Nav + Footer 포함.
 * 랜딩 페이지(/)는 자체 Nav/Footer를 사용하므로 이 래퍼를 쓰지 않는다.
 */
export function SubPageShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="min-h-screen bg-background font-sans text-on-surface">
      <PublicNav />
      {children}
      <PublicFooter />
    </div>
  );
}
