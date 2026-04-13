import Link from "next/link";
import type { ReactElement } from "react";
import { Logo } from "@/components/brand/logo";
import { SITE_NAME } from "@/constants/site";

export function PublicFooter(): ReactElement {
  return (
    <footer className="border-t border-outline-variant/10 bg-surface-container-low px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={24} />
              <span className="font-display text-lg font-bold tracking-tight">
                {SITE_NAME}
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-on-surface-variant">
              모든 쇼핑몰의 정보를 AI가 이해할 수 있는 언어로 변환합니다.
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="mb-4 text-sm font-bold text-on-surface">제품</p>
              <ul className="space-y-3 text-sm text-on-surface-variant">
                <li>
                  <Link href="/features" className="transition-colors hover:text-primary">기능 소개</Link>
                </li>
                <li>
                  <Link href="/pricing" className="transition-colors hover:text-primary">요금 안내</Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-4 text-sm font-bold text-on-surface">회사</p>
              <ul className="space-y-3 text-sm text-on-surface-variant">
                <li>
                  <Link href="/about" className="transition-colors hover:text-primary">소개</Link>
                </li>
                <li>
                  <a href="mailto:contact@chatsio.io" className="transition-colors hover:text-primary">문의</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-outline-variant/10 pt-8 md:flex-row">
          <p className="text-xs text-on-surface-variant">
            © 2026 {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-on-surface-variant">
            <Link href="/privacy" className="transition-colors hover:text-primary">개인정보처리방침</Link>
            <Link href="/terms" className="transition-colors hover:text-primary">이용약관</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
