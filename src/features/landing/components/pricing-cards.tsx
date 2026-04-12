import Link from "next/link";
import { Check } from "lucide-react";
import type { ReactElement } from "react";

interface PricingTier {
  name: string;
  price: string;
  features: string[];
  cta: string;
  href: string;
  recommended: boolean;
}

const TIERS: readonly PricingTier[] = [
  {
    name: "Starter",
    price: "9.9",
    features: ["월 50회 상품 분석", "JSON-LD 자동 생성", "표준 Schema 지원"],
    cta: "시작하기",
    href: "/signup",
    recommended: false,
  },
  {
    name: "Growth",
    price: "19.9",
    features: [
      "월 120회 상품 분석",
      "llms.txt 우선 생성",
      "AI 검색 순위 모니터링",
      "이메일 기술 지원",
    ],
    cta: "무료 체험하기",
    href: "/signup",
    recommended: true,
  },
  {
    name: "Pro",
    price: "39.9",
    features: ["분석 횟수 무제한", "API 커스텀 연동", "실시간 데이터 동기화"],
    cta: "문의하기",
    href: "/signup",
    recommended: false,
  },
];

function TierCard({ tier }: { tier: PricingTier }): ReactElement {
  const card = (
    <div
      className={`flex h-full flex-col rounded-[2.3rem] bg-surface-container-lowest p-8 ${
        tier.recommended ? "" : "shadow-[var(--shadow-md)]"
      }`}
    >
      <h3
        className={`text-xl font-bold ${tier.recommended ? "text-primary" : ""}`}
      >
        {tier.name}
      </h3>
      <div className="mb-6 mt-2">
        <span className="font-display text-4xl font-extrabold tracking-tight">
          {tier.price}
        </span>
        <span className="text-sm text-on-surface-variant">만원/월</span>
      </div>
      <ul className="mb-8 flex-1 space-y-4">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-sm">
            <Check className="h-4 w-4 shrink-0 text-secondary" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={tier.href}
        className={`block w-full rounded-2xl py-4 text-center font-bold transition-all ${
          tier.recommended
            ? "bg-linear-to-br from-primary to-primary-container text-on-primary shadow-[var(--shadow-lg)] hover:-translate-y-0.5"
            : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
        }`}
      >
        {tier.cta}
      </Link>
    </div>
  );

  if (tier.recommended) {
    return (
      <div className="relative rounded-[2.5rem] bg-primary p-1 shadow-[var(--shadow-xl)] md:scale-105">
        <span className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-on-secondary">
          Recommended
        </span>
        {card}
      </div>
    );
  }

  return (
    <div className="rounded-[2.5rem] border border-outline-variant/10 shadow-[var(--shadow-md)]">
      {card}
    </div>
  );
}

export function PricingCards(): ReactElement {
  return (
    <div className="grid items-center gap-8 md:grid-cols-3">
      {TIERS.map((tier) => (
        <TierCard key={tier.name} tier={tier} />
      ))}
    </div>
  );
}
