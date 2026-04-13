import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import {
  ArrowRight,
  BarChart3,
  Code2,
  FileText,
  Image,
  Search,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SITE_URL, SITE_NAME } from "@/constants/site";

export const metadata: Metadata = {
  title: "기능 소개",
  description:
    "AI 상품 속성 추출, JSON-LD 자동 생성, llms.txt, AI 인용 추적까지. Chatsio의 핵심 기능을 알아보세요.",
  alternates: { canonical: `${SITE_URL}/features` },
  openGraph: {
    title: "기능 소개 — Chatsio",
    description: "AI 상품 속성 추출, JSON-LD 자동 생성, llms.txt, AI 인용 추적까지.",
    url: `${SITE_URL}/features`,
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
};

const FEATURES = [
  {
    icon: Image,
    title: "AI 상품 속성 자동 추출",
    description:
      "상품 URL을 입력하면 AI가 텍스트와 이미지를 분석하여 소재, 사이즈, 색상, 가격 등을 자동으로 추출합니다.",
    details: [
      "멀티모달 AI 분석 (텍스트 + 이미지)",
      "의류 속성 추출 정확도 97.3%",
      "사이즈표, 소재 태그 등 이미지 속 정보 인식",
      "Basic(빠른 분석) / Premium(심층 분석) 선택",
    ],
  },
  {
    icon: Code2,
    title: "JSON-LD 자동 생성",
    description:
      "추출된 속성을 Google이 권장하는 Schema.org Product 마크업으로 자동 변환합니다.",
    details: [
      "Schema.org Product 스키마 준수",
      "Google Rich Results 즉시 활성화",
      "가격, 재고, 리뷰 등 구조화",
      "Loader JS 1줄로 자동 적용",
    ],
  },
  {
    icon: FileText,
    title: "llms.txt 자동 생성",
    description:
      "AI 검색엔진이 쇼핑몰과 상품을 정확하게 이해할 수 있도록 구조화된 텍스트 파일을 생성합니다.",
    details: [
      "개별 SKU 단위 상세 구조화",
      "ChatGPT, Perplexity, Gemini 대응",
      "쇼핑몰 전체 + 상품별 이중 구조",
      "카페24 기본 llms.txt 대비 10배+ 상세",
    ],
  },
  {
    icon: Search,
    title: "AI 인용 추적 (Citation Tracking)",
    description:
      "실제로 AI 검색엔진에서 상품이 추천되는지 자동으로 추적하고 Citation Score로 수치화합니다.",
    details: [
      "구매 의도 질문 자동 생성 (Claude AI)",
      "ChatGPT에 질의 후 인용 여부 파싱",
      "Citation Score 0~100 산출",
      "Before/After 비교로 효과 증명",
    ],
  },
  {
    icon: Sparkles,
    title: "원클릭 설치",
    description:
      "Loader JS 스크립트 1줄을 쇼핑몰에 붙여넣기만 하면 JSON-LD가 자동으로 모든 상품 페이지에 적용됩니다.",
    details: [
      "Cafe24 스킨 편집에서 5분 설치",
      "개발 지식 불필요",
      "상품 추가/변경 시 자동 업데이트",
      "단계별 설치 가이드 제공",
    ],
  },
  {
    icon: BarChart3,
    title: "대시보드",
    description:
      "상품별 최적화 현황, AI 인용 상태, 비용 모니터링을 한눈에 확인합니다.",
    details: [
      "상품별 최적화 점수 + Citation Score",
      "Before/After 비교 카드",
      "AI API 비용 추정 + 일별 추이",
      "CSV 내보내기",
    ],
  },
] as const;

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "기능", item: `${SITE_URL}/features` },
  ],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/#software`,
  name: SITE_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "AI 상품 속성 추출, JSON-LD 자동 생성, llms.txt, AI 인용 추적까지. 쇼핑몰 상품 데이터를 자동 구조화하는 SaaS.",
  featureList: [
    "AI 상품 속성 자동 추출 (정확도 97.3%)",
    "JSON-LD Schema.org Product 자동 생성",
    "llms.txt SKU 단위 자동 생성",
    "AI 인용 추적 (Citation Score 0~100)",
    "Loader JS 원클릭 설치",
    "대시보드 모니터링",
  ],
  url: `${SITE_URL}/features`,
};

export default function FeaturesPage(): ReactElement {
  return (
    <div className="min-h-screen bg-background font-sans text-on-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
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
          URL 하나로<br />AI 검색 최적화 완성
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-on-surface-variant">
          상품 URL만 연결하면 AI가 속성을 추출하고, JSON-LD와 llms.txt를 생성하고,
          AI 검색엔진에서 실제로 추천되는지까지 추적합니다.
        </p>
      </section>

      {/* 기능 목록 */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="space-y-12">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`flex flex-col gap-8 rounded-3xl p-8 shadow-[var(--shadow-sm)] sm:flex-row sm:items-start sm:p-10 ${
                i % 2 === 0
                  ? "bg-surface-container-lowest"
                  : "bg-surface-container-low"
              }`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <f.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
                  {f.title}
                </h2>
                <p className="mt-2 text-on-surface-variant leading-relaxed">
                  {f.description}
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {f.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-on-surface-variant">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-outline-variant/10 bg-surface-container-low py-16 text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          지금 바로 시작하세요
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
