import Link from "next/link";
import type { ReactElement } from "react";
import { Logo } from "@/components/brand/logo";
import { SITE_NAME } from "@/constants/site";

interface PublicNavProps {
  /** "landing" = fixed + 그라디언트 CTA + FAQ/로그인 링크, "subpage" = static + 단색 CTA */
  readonly variant?: "landing" | "subpage";
}

export function PublicNav({ variant = "subpage" }: PublicNavProps): ReactElement {
  const isLanding = variant === "landing";

  return (
    <nav
      className={
        isLanding
          ? "fixed top-0 z-50 w-full bg-white/80 shadow-sm backdrop-blur-xl dark:bg-[#0e1419]/80"
          : "border-b border-outline-variant/10 bg-white/80 backdrop-blur-xl dark:bg-[#0e1419]/80"
      }
    >
      <div
        className={`mx-auto flex items-center justify-between px-6 py-4 ${
          isLanding ? "max-w-7xl" : "max-w-5xl"
        }`}
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={isLanding ? 32 : 28} />
            <span
              className={`font-display font-bold tracking-tight ${
                isLanding ? "text-xl" : "text-lg"
              }`}
            >
              {SITE_NAME}
            </span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/features"
              className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
            >
              기능
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
            >
              요금
            </Link>
            {isLanding && (
              <a
                href="#faq"
                className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
              >
                FAQ
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-on-surface-variant hover:text-primary sm:inline-block"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className={
              isLanding
                ? "rounded-full bg-linear-to-br from-[#006195] to-[#007aba] px-6 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-md)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                : "rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:shadow-lg"
            }
          >
            무료로 시작하기
          </Link>
        </div>
      </div>
    </nav>
  );
}
