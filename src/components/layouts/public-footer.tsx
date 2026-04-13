import Link from "next/link";
import type { ReactElement } from "react";
import { AtSign, Share2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SITE_NAME } from "@/constants/site";

export function PublicFooter(): ReactElement {
  return (
    <footer className="border-t border-outline-variant/10 bg-surface-container-low px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-12 md:grid-cols-4">
          {/* 브랜드 + 소셜 */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={28} />
              <span className="font-display text-xl font-bold tracking-tight">
                {SITE_NAME}
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-on-surface-variant">
              모든 쇼핑몰의 정보를 AI가 이해할 수 있는 언어로 변환합니다.
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

          {/* 제품 */}
          <div>
            <p className="mb-6 font-bold text-on-surface">제품</p>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li>
                <Link href="/features" className="transition-colors hover:text-primary">
                  AI 속성 추출
                </Link>
              </li>
              <li>
                <Link href="/features" className="transition-colors hover:text-primary">
                  JSON-LD 빌더
                </Link>
              </li>
              <li>
                <Link href="/features" className="transition-colors hover:text-primary">
                  llms.txt 생성
                </Link>
              </li>
            </ul>
          </div>

          {/* 리소스 */}
          <div>
            <p className="mb-6 font-bold text-on-surface">리소스</p>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li>
                <Link href="/pricing" className="transition-colors hover:text-primary">
                  요금 안내
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-primary">
                  서비스 소개
                </Link>
              </li>
            </ul>
          </div>

          {/* 문의 */}
          <div>
            <p className="mb-6 font-bold text-on-surface">문의</p>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li>contact@chatsio.io</li>
            </ul>
          </div>
        </div>

        {/* 하단 */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/10 pt-8 md:flex-row">
          <p className="text-xs text-on-surface-variant">
            © 2026 {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-on-surface-variant">
            <Link href="/privacy" className="transition-colors hover:text-primary">
              개인정보처리방침
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              이용약관
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
