import Link from "next/link";
import type { ReactElement } from "react";
import { Logo } from "@/components/brand/logo";
import { SITE_NAME } from "@/constants/site";

export function PublicNav(): ReactElement {
  return (
    <nav className="border-b border-outline-variant/10 bg-white/80 backdrop-blur-xl dark:bg-[#0e1419]/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="font-display text-lg font-bold tracking-tight">
            {SITE_NAME}
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/features"
            className="hidden text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary sm:inline-block"
          >
            기능
          </Link>
          <Link
            href="/pricing"
            className="hidden text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary sm:inline-block"
          >
            요금
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            무료로 시작하기
          </Link>
        </div>
      </div>
    </nav>
  );
}
