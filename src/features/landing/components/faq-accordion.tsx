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
    question: "JSON-LD가 뭔가요? 왜 필요한가요?",
    answer:
      "JSON-LD는 구글이 권장하는 구조화 데이터 형식입니다. 상품의 이름, 가격, 소재, 리뷰 등을 검색엔진이 이해할 수 있는 표준 형식으로 변환합니다. 적용하면 구글 검색 결과에 별점, 가격, 재고 여부 등이 Rich Results로 표시되어 클릭률이 크게 높아집니다.",
  },
  {
    question: "llms.txt가 뭔가요?",
    answer:
      "llms.txt는 AI 검색엔진(ChatGPT, Perplexity, Gemini 등)이 웹사이트를 이해할 수 있도록 도와주는 텍스트 파일입니다. robots.txt가 크롤러에게 접근 허용을 안내하듯, llms.txt는 AI에게 사이트의 핵심 정보를 구조화하여 전달합니다. Chatsio는 쇼핑몰의 상품 정보를 기반으로 llms.txt를 자동 생성합니다.",
  },
  {
    question: "SEO에 어떤 영향을 주나요?",
    answer:
      "JSON-LD Schema.org 마크업을 적용하면 Google Rich Results에 노출될 수 있으며, llms.txt를 통해 ChatGPT, Perplexity 등 AI 검색엔진이 상품 정보를 정확하게 이해하고 추천할 수 있습니다.",
  },
  {
    question: "AI 검색엔진에서 내 상품이 추천되려면 어떻게 해야 하나요?",
    answer:
      "AI 검색엔진은 구조화된 데이터를 가진 페이지를 우선적으로 인용합니다. Chatsio가 생성하는 JSON-LD와 llms.txt를 적용하면 ChatGPT, Perplexity 같은 AI가 상품 정보를 정확하게 이해하고 사용자 질문에 대한 답변에 포함시킬 가능성이 높아집니다.",
  },
  {
    question: "어떤 쇼핑몰 플랫폼을 지원하나요?",
    answer:
      "현재 Cafe24를 우선 지원하며, 아임웹과 고도몰은 순차적으로 확장 예정입니다. Loader JS 방식을 사용하면 플랫폼에 관계없이 HTML 편집이 가능한 모든 쇼핑몰에 적용할 수 있습니다.",
  },
  {
    question: "상품 이미지만으로 속성을 추출할 수 있나요?",
    answer:
      "네, Chatsio의 AI는 멀티모달 분석을 지원합니다. 상품 이미지에서 소재 태그, 사이즈표, 색상 정보 등을 인식하고, 텍스트와 결합하여 정확한 속성 데이터를 추출합니다. 의류 카테고리 기준 추출 정확도 97.3%를 달성하고 있습니다.",
  },
  {
    question: "설치하는 데 개발 지식이 필요한가요?",
    answer:
      "아닙니다. Chatsio가 생성한 Loader JS 스크립트 1줄을 쇼핑몰 관리자 페이지에 붙여넣기만 하면 됩니다. Cafe24 기준 5분 이내에 설치가 완료되며, 단계별 설치 가이드를 제공합니다.",
  },
  {
    question: "무료 체험이 가능한가요?",
    answer:
      "네, 파일럿 프로그램을 통해 3개월 무료 체험이 가능합니다. 무료 체험 기간 동안 모든 기능(AI 속성 추출, JSON-LD 생성, llms.txt 생성, AI 인용 추적)을 사용할 수 있습니다.",
  },
  {
    question: "카페24 llms.txt와 뭐가 다른가요?",
    answer:
      "카페24가 제공하는 llms.txt는 쇼핑몰 전체에 대한 소개 수준입니다. Chatsio는 개별 상품(SKU) 단위로 소재, 사이즈, 색상, 가격 등 상세 속성을 구조화합니다. AI 검색엔진이 '면 소재 오버핏 반팔 추천해줘'라는 질문에 답하려면 SKU 수준의 상세 데이터가 필요합니다.",
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
