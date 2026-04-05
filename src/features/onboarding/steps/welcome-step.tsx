"use client";

import { Button } from "@/components/ui/button";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center text-center">
      {/* 아이콘 */}
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "var(--primary-fixed)" }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--primary)" }}
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>

      <h2
        className="mb-3 text-2xl font-bold tracking-tight"
        style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
      >
        Chatsio에 오신 것을 환영합니다
      </h2>

      <p
        className="mb-2 text-base leading-relaxed"
        style={{ color: "var(--on-surface-variant)" }}
      >
        AI가 상품 이미지를 분석하여 구조화 데이터를 자동 생성합니다.
      </p>
      <p
        className="mb-8 text-sm"
        style={{ color: "var(--outline)" }}
      >
        쇼핑몰 정보를 등록하고, 첫 상품을 추가하면 바로 시작할 수 있습니다.
      </p>

      {/* 3가지 핵심 가치 */}
      <div className="mb-8 grid w-full gap-3">
        {[
          {
            title: "자동 구조화",
            desc: "상품 이미지에서 속성을 AI로 추출",
          },
          {
            title: "JSON-LD 생성",
            desc: "검색엔진이 이해하는 구조화 데이터",
          },
          {
            title: "AI 인용 추적",
            desc: "AI 검색에서 내 상품이 추천되는지 확인",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 rounded-xl p-3 text-left"
            style={{ background: "var(--surface-container-low)" }}
          >
            <div
              className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
              style={{ background: "var(--primary)" }}
            />
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--on-surface)" }}
              >
                {item.title}
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={onNext} className="w-full">
        시작하기 →
      </Button>
    </div>
  );
}
