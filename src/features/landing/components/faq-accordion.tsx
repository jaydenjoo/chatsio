"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ReactElement } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "정말 URL만 넣으면 분석이 되나요?",
    answer:
      "네, 상품 페이지 URL을 입력하면 AI가 자동으로 페이지를 방문하여 텍스트와 메타데이터를 분석합니다. 별도의 코드 작성이나 수작업 없이 구조화된 데이터를 생성합니다.",
  },
  {
    question: "SEO에 어떤 영향을 주나요?",
    answer:
      "JSON-LD Schema.org 마크업을 적용하면 Google Rich Results에 노출될 수 있으며, llms.txt를 통해 ChatGPT, Perplexity 등 AI 검색엔진이 상품 정보를 정확하게 이해하고 추천할 수 있습니다.",
  },
  {
    question: "데이터 보안은 안전한가요?",
    answer:
      "모든 데이터는 암호화되어 안전하게 보관되며, 고객의 쇼핑몰 정보는 최적화 목적 외에 사용되지 않습니다. Row Level Security로 계정 간 데이터가 철저히 분리됩니다.",
  },
];

export function FaqAccordion(): ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggle(index: number): void {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <div className="space-y-4">
      {FAQ_ITEMS.map((item, index) => (
        <div
          key={item.question}
          className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm"
        >
          <button
            type="button"
            onClick={() => toggle(index)}
            aria-expanded={openIndex === index}
            aria-controls={`faq-answer-${index}`}
            className="group flex w-full items-center justify-between px-8 py-6 text-left"
          >
            <span className="font-bold text-on-surface">{item.question}</span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-outline transition-transform duration-200 group-hover:text-primary ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            id={`faq-answer-${index}`}
            role="region"
            className={`grid transition-all duration-300 ease-in-out ${
              openIndex === index
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <p className="px-8 pb-6 text-sm leading-relaxed text-on-surface-variant">
                {item.answer}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
