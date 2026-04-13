import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ArrowRight } from "lucide-react";
import { PricingCards } from "@/features/landing";
import { SITE_URL, SITE_NAME } from "@/constants/site";
import { SubPageShell } from "../layout";

export const metadata: Metadata = {
  title: "요금제",
  description:
    "Chatsio 요금제 안내. Starter 월 9.9만원부터. JSON-LD 자동 생성, llms.txt, AI 인용 추적. 3개월 무료 파일럿 프로그램 진행 중.",
  keywords: [
    "Chatsio 가격",
    "Chatsio 요금제",
    "쇼핑몰 SEO 비용",
    "JSON-LD 자동 생성 가격",
    "AI 검색 최적화 비용",
  ],
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    title: "요금제 — Chatsio",
    description: "Starter 월 9.9만원부터. 3개월 무료 파일럿 프로그램 진행 중.",
    url: `${SITE_URL}/pricing`,
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
};

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/#software`,
  name: SITE_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "99000",
      priceCurrency: "KRW",
      description: "월 50회 상품 분석, JSON-LD 자동 생성, 표준 Schema 지원",
    },
    {
      "@type": "Offer",
      name: "Growth",
      price: "199000",
      priceCurrency: "KRW",
      description:
        "월 120회 상품 분석, llms.txt 우선 생성, AI 검색 순위 모니터링, 이메일 기술 지원",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "349000",
      priceCurrency: "KRW",
      description: "분석 횟수 무제한, API 커스텀 연동, 실시간 데이터 동기화",
    },
  ],
  url: `${SITE_URL}/pricing`,
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "요금제",
      item: `${SITE_URL}/pricing`,
    },
  ],
};

const FAQ_ITEMS = [
  {
    q: "무료 체험이 가능한가요?",
    a: "네, 파일럿 프로그램을 통해 3개월 무료 체험이 가능합니다. 카드 등록 없이 바로 시작할 수 있습니다.",
  },
  {
    q: "플랜을 중간에 변경할 수 있나요?",
    a: "네, 언제든지 상위 또는 하위 플랜으로 변경할 수 있습니다. 변경 시점에 차액이 정산됩니다.",
  },
  {
    q: "분석 횟수가 초과되면 어떻게 되나요?",
    a: "월 분석 횟수 초과 시 추가 분석이 일시 중단됩니다. 상위 플랜으로 업그레이드하거나 다음 달을 기다리시면 됩니다.",
  },
  {
    q: "환불 정책은 어떻게 되나요?",
    a: "결제 후 7일 이내에 서비스를 이용하지 않은 경우 전액 환불이 가능합니다.",
  },
] as const;

export default function PricingPage(): ReactElement {
  return (
    <SubPageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1
          className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl"
          style={{ letterSpacing: "-0.03em" }}
        >
          성장에만 집중하세요
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-on-surface-variant">
          데이터 관리는 {SITE_NAME}가 책임집니다. 3개월 무료 파일럿 프로그램으로
          부담 없이 시작하세요.
        </p>
      </section>

      {/* 가격표 */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <PricingCards />
      </section>

      {/* FAQ */}
      <section className="border-t border-outline-variant/10 bg-surface-container-low py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2
            className="mb-12 text-center font-display text-2xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            가격 관련 자주 묻는 질문
          </h2>
          <div className="space-y-6">
            {FAQ_ITEMS.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl bg-surface-container-lowest p-6 shadow-[var(--shadow-sm)]"
              >
                <h3 className="font-bold">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <h2
          className="font-display text-2xl font-bold tracking-tight"
          style={{ letterSpacing: "-0.02em" }}
        >
          지금 무료로 시작하세요
        </h2>
        <p className="mt-3 text-on-surface-variant">
          카드 등록 없이 3개월 무료 체험
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          파일럿 신청하기 <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </SubPageShell>
  );
}
