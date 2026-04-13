"use client";

import { useState, type ReactElement } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const STEPS = [
  {
    title: "Cafe24 관리자 로그인",
    content:
      "Cafe24 관리자 페이지(어드민)에 로그인합니다. 메인 URL 뒤에 /admin을 붙이면 관리자 페이지로 이동합니다.",
  },
  {
    title: "디자인 > 스킨 편집 이동",
    content:
      '좌측 메뉴에서 "디자인 관리" > "디자인 보관함"으로 이동합니다. 현재 사용 중인 스킨의 "편집" 버튼을 클릭합니다.',
  },
  {
    title: "layout.html 파일 열기",
    content:
      '스킨 편집기에서 좌측 파일 목록에서 "layout" 폴더의 "layout.html" 파일을 클릭합니다. 이 파일이 모든 페이지의 기본 레이아웃입니다.',
  },
  {
    title: "Loader JS 스크립트 붙여넣기",
    content:
      "layout.html 파일에서 </head> 태그를 찾습니다. 그 바로 위에 위의 \"Loader JS\" 섹션에서 복사한 스크립트 코드를 붙여넣습니다. </head> 태그 직전에 넣어야 정상 동작합니다.",
  },
  {
    title: "저장 + 동작 확인",
    content:
      '"저장" 버튼을 클릭합니다. 쇼핑몰의 아무 상품 페이지를 열고, 브라우저 개발자 도구(F12) > Elements 탭에서 <script type="application/ld+json">이 삽입되었는지 확인합니다.',
  },
] as const;

export function Cafe24Guide(): ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="cafe24-guide-content"
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h3 className="font-display text-lg font-bold text-[var(--on-surface)]">
            Cafe24 설치 가이드
          </h3>
          <p className="mt-0.5 text-xs text-[var(--on-surface-variant)]">
            Cafe24 쇼핑몰에 Loader JS를 설치하는 단계별 안내
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-[var(--outline)]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[var(--outline)]" />
        )}
      </button>

      {isOpen && (
        <div id="cafe24-guide-content" className="mt-6 space-y-4">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex gap-4 rounded-xl bg-[var(--surface-container-low)]/50 p-4"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-bold text-[var(--primary)]">
                {i + 1}
              </div>
              <div>
                <div className="font-semibold text-[var(--on-surface)]">
                  {step.title}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--on-surface-variant)]">
                  {step.content}
                </p>
              </div>
            </div>
          ))}

          {/* 검증 링크 */}
          <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary-container)]/10 p-4">
            <div className="font-semibold text-[var(--on-surface)]">
              설치 후 검증
            </div>
            <p className="mt-1 text-sm text-[var(--on-surface-variant)]">
              Google Rich Results Test에서 상품 페이지 URL을 입력하면 JSON-LD가 정상 적용되었는지 확인할 수 있습니다.
            </p>
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:underline"
            >
              Google Rich Results Test
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
