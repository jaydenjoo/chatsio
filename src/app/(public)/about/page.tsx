import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ArrowRight, Shield, Target, Zap } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Chatsio 소개 — 상품 데이터 인프라",
  description:
    "Chatsio는 한국 중소 쇼핑몰의 상품 데이터를 AI로 구조화하여 검색엔진과 AI 검색에서 발견되도록 돕는 SaaS입니다.",
  alternates: { canonical: "https://chatsio-topaz.vercel.app/about" },
  openGraph: {
    title: "Chatsio 소개 — 상품 데이터 인프라",
    description: "한국 중소 쇼핑몰의 상품 데이터를 AI로 구조화하여 검색엔진과 AI 검색에서 발견되도록 돕습니다.",
    url: "https://chatsio-topaz.vercel.app/about",
  },
};

const VALUES = [
  {
    icon: Target,
    title: "문제 집중",
    description:
      "한국 중소 쇼핑몰의 70% 이상 상품 정보가 이미지 속에만 존재합니다. AI가 읽을 수 없는 데이터는 추천될 수 없습니다. Chatsio는 이 문제를 해결합니다.",
  },
  {
    icon: Zap,
    title: "즉각적 가치",
    description:
      "URL 입력부터 JSON-LD 적용까지 5분. 에이전시에 의뢰하면 수주가 걸리는 작업을 AI가 즉시 처리합니다. 구조화된 데이터는 곧바로 검색 결과에 반영됩니다.",
  },
  {
    icon: Shield,
    title: "증명 가능한 효과",
    description:
      "AI 인용 추적(Citation Tracking)으로 실제로 ChatGPT, Perplexity에서 상품이 추천되는지 데이터로 증명합니다. 감이 아닌 숫자로 효과를 확인합니다.",
  },
] as const;

export default function AboutPage(): ReactElement {
  return (
    <div className="min-h-screen bg-background font-sans text-on-surface">
      {/* Nav */}
      <nav className="border-b border-outline-variant/10 bg-white/80 backdrop-blur-xl dark:bg-[#0e1419]/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-display text-lg font-bold tracking-tight">Chatsio</span>
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            무료로 시작하기
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl" style={{ letterSpacing: "-0.03em" }}>
          AI 시대, 상품 데이터가<br />발견의 조건입니다
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-on-surface-variant">
          ChatGPT에 &ldquo;면 소재 오버핏 반팔 추천해줘&rdquo;라고 물으면, 구조화된 데이터를 가진 쇼핑몰의 상품만 추천됩니다.
          Chatsio는 중소 쇼핑몰이 이 조건을 갖출 수 있도록 돕습니다.
        </p>
      </section>

      {/* 배경 */}
      <section className="border-y border-outline-variant/10 bg-surface-container-low py-16">
        <div className="mx-auto max-w-3xl space-y-6 px-6">
          <h2 className="font-display text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            왜 만들었나
          </h2>
          <p className="text-on-surface-variant leading-relaxed">
            한국에는 8만 개 이상의 독립 쇼핑몰이 있습니다. 하지만 상품 정보를 구조화하여 AI 검색엔진에 대응하는 곳은 사실상 0%입니다.
            이유는 단순합니다 — 방법이 없었습니다. JSON-LD, Schema.org, llms.txt는 비개발자가 만들 수 있는 것이 아닙니다.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            글로벌에는 Profound, Zoovu 같은 솔루션이 있지만 영어권 대기업 전용이고 월 수백만 원입니다.
            한국어를 지원하면서 중소몰 운영자가 부담 없이 사용할 수 있는 도구가 필요했습니다. Chatsio가 그 빈자리를 채웁니다.
          </p>
        </div>
      </section>

      {/* 가치 */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-12 text-center font-display text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          Chatsio가 중요하게 생각하는 것
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl bg-surface-container-lowest p-8 shadow-[var(--shadow-sm)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <v.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold">{v.title}</h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-outline-variant/10 bg-surface-container-low py-16 text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          AI 검색에서 발견되는 쇼핑몰을 만드세요
        </h2>
        <p className="mt-3 text-on-surface-variant">3개월 무료 파일럿 프로그램 진행 중</p>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          무료로 시작하기 <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
