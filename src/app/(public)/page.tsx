import Link from "next/link";
import type { ReactElement } from "react";
import { Logo } from "@/components/brand/logo";

export const metadata = {
  title: "Chatsio — 쇼핑몰 상품 데이터 인프라",
  description:
    "URL만 연결하면 JSON-LD + 네이버EP를 자동 생성하고 AI 검색엔진 인용을 추적하는 SaaS.",
};

export default function HomePage(): ReactElement {
  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans text-foreground">
      {/* 배경 미세 도트 — 디자인 시스템 v3.0 기본 텍스처 */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--outline-variant) 0.5px, transparent 0.5px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Top Nav */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Chatsio 홈"
        >
          <Logo size={32} />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Chatsio
          </span>
        </Link>
        <Link
          href="/login"
          className="rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          로그인
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 items-center justify-center px-6 pb-20 sm:px-10">
        <div className="flex w-full max-w-2xl flex-col items-center text-center">
          {/* 상태 뱃지 */}
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            Beta · 한국 중소 쇼핑몰 전용
          </span>

          {/* 헤드라인 */}
          <h1 className="font-display text-4xl font-extrabold leading-[1.15] tracking-[-0.03em] text-foreground sm:text-5xl md:text-6xl">
            쇼핑몰 상품을
            <br />
            <span className="text-primary">AI가 읽을 수 있게.</span>
          </h1>

          {/* 서브 카피 */}
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            URL만 연결하면 JSON-LD + 네이버EP를 자동 생성하고
            <br className="hidden sm:inline" />
            AI 검색엔진이 당신의 상품을 인용하는지 추적합니다.
          </p>

          {/* CTA pair */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/signup"
              className="group inline-flex h-12 items-center justify-center gap-1.5 rounded-lg bg-primary px-7 text-base font-semibold text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,97,149,0.20)] transition-all hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_14px_36px_rgba(0,97,149,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              지금 시작
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-transparent px-7 text-base font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              로그인
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 px-6 py-6 sm:px-10">
        <p className="text-center text-xs text-muted-foreground">
          © 2026 Chatsio · 한국 중소 쇼핑몰을 위한 상품 데이터 인프라
        </p>
      </footer>
    </div>
  );
}
