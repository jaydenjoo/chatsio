import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import {
  ArrowRight,
  AtSign,
  BadgeCheck,
  Ban,
  BarChart3,
  Brain,
  Check,
  Code,
  CreditCard,
  FileCode,
  FileText,
  Link2,
  Share2,
  Sparkles,
  Timer,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { FaqAccordion, PricingCards } from "@/features/landing";

export const metadata: Metadata = {
  title: "Chatsio — 쇼핑몰 상품 데이터 인프라",
  description:
    "URL만 연결하면 JSON-LD + llms.txt를 자동 생성하고 AI 검색엔진이 당신의 상품을 추천하는지 추적합니다.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const PAIN_POINTS = [
  {
    icon: Ban,
    title: "상품 정보의 70%가 이미지 속에 갇혀 있습니다",
    desc: "검색 엔진과 AI는 텍스트만 읽을 수 있습니다. 이미지는 검색되지 않습니다.",
  },
  {
    icon: Timer,
    title: "수작업 구조화: 상품 1개당 20~40분",
    desc: "일일이 스키마를 짜고 데이터를 입력하는 것은 비효율적입니다.",
  },
  {
    icon: CreditCard,
    title: "에이전시 비용: 500개 기준 월 1,500만원",
    desc: "전문가 고용 비용은 중소 쇼핑몰에 큰 부담입니다.",
  },
] as const;

const STEPS = [
  {
    icon: Link2,
    title: "URL 연결",
    desc: "상품 페이지 URL 혹은\n사이트맵을 입력하세요.",
    accent: false,
  },
  {
    icon: Brain,
    title: "AI 분석",
    desc: "AI가 이미지와 텍스트에서\n핵심 속성을 추출합니다.",
    accent: true,
  },
  {
    icon: Code,
    title: "코드 복사",
    desc: "생성된 JSON-LD를\n헤더에 붙여넣으면 끝!",
    accent: false,
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage(): ReactElement {
  return (
    <div className="relative min-h-screen bg-background font-sans text-on-surface">
      {/* 배경 도트 패턴 — globals.css body::before에서 처리 */}

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 shadow-sm backdrop-blur-xl dark:bg-[#0e1419]/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={32} />
              <span className="font-display text-xl font-bold tracking-tight">
                Chatsio
              </span>
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary">기능</a>
              <a href="#pricing" className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary">요금</a>
              <a href="#faq" className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary">FAQ</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden text-sm font-semibold text-on-surface-variant hover:text-primary sm:inline-block">
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-linear-to-br from-[#006195] to-[#007aba] px-6 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-md)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      </nav>

      <main className="overflow-hidden pt-24">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-12 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-12">
            {/* 좌: 헤드라인 */}
            <div className="md:col-span-7">
              <span className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-1.5 text-sm font-bold text-on-secondary-fixed-variant dark:bg-white/10 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
                AI 검색 시대, 상품 데이터가 경쟁력입니다
              </span>
              <h1 className="animate-fade-up font-display text-4xl font-extrabold leading-tight tracking-[-0.03em] text-on-surface [animation-delay:0.1s] md:text-6xl">
                쇼핑몰 URL만 연결하면{" "}
                <span className="text-primary">
                  AI가 상품정보를 자동 구조화
                </span>
                합니다
              </h1>
              <p className="animate-fade-up mt-6 max-w-2xl text-lg text-on-surface-variant [animation-delay:0.2s] md:text-xl">
                JSON-LD + llms.txt 자동 생성. ChatGPT, Perplexity가 당신의
                쇼핑몰 상품을 정확하게 이해하고 추천하도록 데이터 브릿지를
                구축하세요.
              </p>
              <div className="animate-fade-up mt-10 flex flex-wrap items-center gap-4 [animation-delay:0.3s]">
                <Link
                  href="/signup"
                  className="group flex items-center gap-2 rounded-2xl bg-linear-to-br from-[#006195] to-[#007aba] px-8 py-4 text-lg font-bold text-white shadow-[var(--shadow-lg)] transition-transform hover:-translate-y-0.5"
                >
                  무료로 시작하기
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <div className="flex items-center gap-2 rounded-xl bg-surface-container px-4 py-2">
                  <BadgeCheck className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-semibold">
                    의류 속성 추출 정확도 97.3%
                  </span>
                </div>
              </div>
            </div>

            {/* 우: JSON-LD 코드 프리뷰 */}
            <div className="relative md:col-span-5">
              <div className="animate-fade-up rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-[var(--shadow-xl)] [animation-delay:0.2s]">
                {/* 브라우저 바 */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <div className="ml-4 flex h-6 flex-1 items-center rounded-lg bg-surface-container-low px-3 text-[10px] text-outline">
                    chatsio.io/v1/product/extraction
                  </div>
                </div>
                {/* JSON-LD 코드 */}
                <div className="space-y-1 font-mono text-xs leading-relaxed text-on-surface-variant">
                  <p className="text-blue-600 dark:text-blue-400">
                    {'"@context": "https://schema.org/",'}
                  </p>
                  <p className="text-blue-600 dark:text-blue-400">
                    {'"@type": "Product",'}
                  </p>
                  <p>{'"name": "프리미엄 오버사이즈 블레이저",'}</p>
                  <p>{'"color": "미드나잇 블루",'}</p>
                  <p>{'"material": ["울 80%", "실크 20%"],'}</p>
                  <p>{'"features": ["구조적 숄더", "더블 브레스티드"],'}</p>
                  <p>{'"availability": "InStock",'}</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    {"// AI가 자동 추출한 구조화 데이터"}
                  </p>
                </div>
                {/* 분석 결과 미리보기 */}
                <div className="mt-6 rounded-xl bg-surface-container-low p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                      👗
                    </div>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
                      <div className="h-full w-[97%] rounded-full bg-secondary" />
                    </div>
                    <span className="text-xs font-bold text-secondary">
                      97.3%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-8 rounded-lg border border-outline-variant/20 bg-surface-container-low" />
                    <div className="h-8 rounded-lg border border-outline-variant/20 bg-surface-container-low" />
                  </div>
                </div>
              </div>
              {/* 데코 블롭 */}
              <div
                aria-hidden
                className="absolute -bottom-6 -right-6 -z-10 h-32 w-32 rounded-full bg-secondary-container opacity-40 blur-3xl"
              />
            </div>
          </div>
        </section>

        {/* ── Pain → Solution (다크 섹션) ───────────────────────── */}
        <section className="bg-[#1a1e24] py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-12">
            {/* Pain */}
            <div className="md:col-span-5">
              <h2 className="mb-10 flex items-center gap-3 text-3xl font-bold tracking-[-0.02em] text-white">
                <span className="h-1 w-8 rounded-full bg-secondary" />
                지금 중소 쇼핑몰의 현실
              </h2>
              <ul className="space-y-8">
                {PAIN_POINTS.map((p) => (
                  <li key={p.title} className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                      <p.icon className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">
                        {p.title}
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                        {p.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div className="md:col-span-7">
              <div className="relative rounded-[2.5rem] border border-white/[0.08] bg-white/[0.06] p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-display text-2xl font-bold text-white">
                    Chatsio가 해결합니다
                  </h3>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-white">
                    SOLVED
                  </span>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Before */}
                  <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-6">
                    <span className="mb-4 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                      BEFORE
                    </span>
                    <div className="flex h-40 items-center justify-center rounded-lg bg-white/[0.03]">
                      <div className="text-center">
                        <div className="mx-auto mb-3 h-16 w-24 rounded-lg bg-white/[0.08]" />
                        <div className="mx-auto h-2 w-20 rounded bg-white/[0.08]" />
                        <div className="mx-auto mt-2 h-2 w-14 rounded bg-white/[0.08]" />
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-white/50">
                      검색 로봇: &quot;정보를 찾을 수 없음&quot;
                    </p>
                  </div>
                  {/* After */}
                  <div className="relative overflow-hidden rounded-2xl bg-[#0f1318] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                    <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-secondary/20 blur-2xl" />
                    <span className="relative mb-4 block text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      AFTER
                    </span>
                    <div className="relative z-10 space-y-3">
                      <div className="flex h-2 items-center rounded bg-emerald-500/15 px-2">
                        <div className="h-1 w-1/2 rounded bg-emerald-400" />
                      </div>
                      <div className="flex h-2 items-center rounded bg-emerald-500/15 px-2">
                        <div className="h-1 w-2/3 rounded bg-emerald-400" />
                      </div>
                      <div className="flex h-2 items-center rounded bg-emerald-500/15 px-2">
                        <div className="h-1 w-1/3 rounded bg-emerald-400" />
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] font-bold text-white/90">
                          LLM 최적화 완료
                        </span>
                      </div>
                    </div>
                    <p className="mt-4 text-xs font-bold text-emerald-300">
                      ChatGPT: &quot;최고의 재킷 추천&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ──────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-20 text-center">
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">
              단 3단계로 끝내는 AI 데이터 최적화
            </h2>
            <p className="mt-4 text-on-surface-variant">
              코딩 없이 URL만으로 당신의 상품을 AI 검색 친화적으로 만드세요.
            </p>
          </div>
          <div className="relative flex flex-col items-start justify-between gap-12 md:flex-row">
            {/* 연결선 (md 이상) */}
            <div
              aria-hidden
              className="absolute left-0 top-12 -z-10 hidden h-0.5 w-full bg-surface-container-highest md:block"
            >
              <div className="h-full w-1/2 rounded-full bg-primary" />
            </div>
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex-1 text-center">
                <div
                  className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-surface shadow-[var(--shadow-lg)] transition-transform hover:scale-110 ${
                    step.accent
                      ? "bg-primary-container"
                      : "bg-surface-container-lowest"
                  }`}
                >
                  <step.icon
                    className={`h-10 w-10 ${step.accent ? "text-on-primary" : "text-primary"}`}
                  />
                </div>
                <h3 className="mb-2 text-xl font-bold">
                  Step {i + 1}. {step.title}
                </h3>
                <p className="whitespace-pre-line text-sm text-on-surface-variant">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features Bento Grid ───────────────────────────────── */}
        <section id="features" className="bg-surface-container-low py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-[-0.02em]">
                  핵심 기능
                </h2>
                <p className="mt-4 text-on-surface-variant">
                  단순한 정보 추출을 넘어 AI 검색의 표준을 만듭니다.
                </p>
              </div>
            </div>
            <div className="grid h-auto gap-6 md:h-[600px] md:grid-cols-4 md:grid-rows-2">
              {/* 카드 1: AI 분석 (2×2 large) */}
              <div className="relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-surface-container-lowest p-10 shadow-[var(--shadow-lg)] md:col-span-2 md:row-span-2">
                <div
                  aria-hidden
                  className="absolute -translate-y-1/2 translate-x-1/2 right-0 top-0 h-64 w-64 rounded-full bg-primary-fixed/20 blur-3xl"
                />
                <div>
                  <BarChart3 className="mb-6 h-12 w-12 text-primary" />
                  <h3 className="font-display text-2xl font-bold">
                    AI 상품 심층 분석
                  </h3>
                  <p className="mt-4 text-on-surface-variant">
                    단순 텍스트 추출이 아닌, 패션/가전/뷰티 등 카테고리별 특화
                    로직으로 정교한 데이터를 생성합니다.
                  </p>
                </div>
                <div className="mt-12 rounded-2xl bg-surface-container-low p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                      👗
                    </div>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
                      <div className="h-full w-[97%] rounded-full bg-secondary" />
                    </div>
                    <span className="text-xs font-bold text-secondary">
                      97.3%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-8 rounded-lg border border-outline-variant/20 bg-surface-container-low" />
                    <div className="h-8 rounded-lg border border-outline-variant/20 bg-surface-container-low" />
                  </div>
                </div>
              </div>

              {/* 카드 2: JSON-LD (2×1 dark) — 하드코딩 다크 배경 (다크모드 inverse 방지) */}
              <div className="flex flex-col justify-between rounded-[2rem] bg-[#1e2430] p-8 shadow-[var(--shadow-md)] md:col-span-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">
                      JSON-LD 자동 생성
                    </h3>
                    <p className="mt-2 text-sm text-white/60">
                      Schema.org 표준을 준수하는 최적의 스키마 자동 빌드.
                    </p>
                  </div>
                  <FileCode className="h-6 w-6 shrink-0 text-emerald-400" />
                </div>
                <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/30 p-4 font-mono text-[10px]">
                  <span className="text-pink-400">&quot;brand&quot;</span>
                  {": { "}
                  <span className="text-emerald-400">&quot;@type&quot;</span>
                  {": "}
                  <span className="text-amber-300">&quot;Brand&quot;</span>
                  {", "}
                  <span className="text-pink-400">&quot;name&quot;</span>
                  {": "}
                  <span className="text-amber-300">
                    &quot;MyShop&quot;
                  </span>
                  {" }"}
                </div>
              </div>

              {/* 카드 3: llms.txt (1×1) */}
              <div className="rounded-[2rem] border border-outline-variant/5 bg-surface-container-lowest p-8 shadow-[var(--shadow-md)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">
                    llms.txt 생성
                  </h3>
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs text-on-surface-variant">
                  LLM 크롤러를 위한 마크다운 기반의 구조화 정보를 자동
                  생성합니다.
                </p>
                <div className="mt-6 flex gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary/30" />
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary/30" />
                </div>
              </div>

              {/* 카드 4: AI 인용 추적 (1×1 soon) — 도넛 차트 */}
              <div className="relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-surface-container-high p-8 shadow-[var(--shadow-sm)]">
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-lg font-bold">
                    AI 인용 추적
                  </h3>
                  <span className="rounded-full bg-on-surface px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-on-surface">
                    Soon
                  </span>
                </div>
                <div className="mt-4">
                  <div className="relative mx-auto h-16 w-16">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32" cy="32" r="28" fill="transparent"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-surface-container-highest"
                      />
                      <circle
                        cx="32" cy="32" r="28" fill="transparent"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray="175"
                        strokeDashoffset="140"
                        strokeLinecap="round"
                        className="text-[#006195]"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                      20%
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-center text-[10px] text-on-surface-variant">
                  ChatGPT 인용 횟수 분석
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────── */}
        <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">
              성장에만 집중하세요
            </h2>
            <p className="mt-4 text-on-surface-variant">
              데이터 관리는 Chatsio가 책임집니다.
            </p>
          </div>
          <PricingCards />
        </section>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <section id="faq" className="bg-surface-container-low/50 py-24">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-16 text-center font-display text-3xl font-bold tracking-[-0.02em]">
              자주 묻는 질문
            </h2>
            <FaqAccordion />
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="relative overflow-hidden rounded-[3rem] bg-linear-to-br from-[#006195] to-[#004b74] p-12 text-center shadow-[var(--shadow-xl)] md:p-20">
            {/* 데코 SVG */}
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <path
                d="M0 100 C 20 0 50 0 100 100"
                fill="transparent"
                stroke="white"
                strokeWidth="0.1"
              />
            </svg>
            <h2 className="relative font-display text-3xl font-extrabold leading-tight tracking-[-0.02em] text-white md:text-5xl">
              AI 검색에서 당신의 상품이
              <br />
              추천되는 경험, 지금 시작하세요
            </h2>
            <div className="relative mt-10 flex flex-col items-center justify-center gap-6 md:flex-row">
              <Link
                href="/signup"
                className="group flex items-center gap-2 rounded-2xl bg-white px-10 py-5 text-xl font-extrabold text-primary shadow-[var(--shadow-lg)] transition-all hover:scale-105 active:scale-95"
              >
                무료로 시작하기
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="font-semibold text-white/80">
                카드 등록 없이 바로 시작 가능
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-outline-variant/10 bg-surface-container-low px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-12 md:grid-cols-4">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-2.5">
                <Logo size={28} />
                <span className="font-display text-xl font-bold tracking-tight">
                  Chatsio
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                모든 쇼핑몰의 정보를 AI가 이해할 수 있는 언어로 변환합니다.
                차세대 AI 커머스 데이터 솔루션.
              </p>
              <div className="flex gap-3">
                <a
                  href="mailto:contact@chatsio.io"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant transition-colors hover:bg-[#006195] hover:text-white"
                  aria-label="이메일"
                >
                  <AtSign className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant transition-colors hover:bg-[#006195] hover:text-white"
                  aria-label="공유"
                >
                  <Share2 className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="mb-6 font-bold text-on-surface">제품</h4>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li><a href="#features" className="transition-colors hover:text-primary">AI 속성 추출</a></li>
                <li><a href="#features" className="transition-colors hover:text-primary">JSON-LD 빌더</a></li>
                <li><a href="#features" className="transition-colors hover:text-primary">llms.txt 생성</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 font-bold text-on-surface">리소스</h4>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li><a href="#faq" className="transition-colors hover:text-primary">자주 묻는 질문</a></li>
                <li><a href="#pricing" className="transition-colors hover:text-primary">요금 안내</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 font-bold text-on-surface">문의</h4>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li>contact@chatsio.io</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/10 pt-8 md:flex-row">
            <p className="text-xs text-on-surface-variant">
              © 2026 Chatsio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
