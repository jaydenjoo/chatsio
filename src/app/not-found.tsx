import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false, follow: false },
};

export default function NotFound(): ReactElement {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="font-display text-8xl font-extrabold text-[var(--primary)]/20">
        404
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold text-[var(--on-surface)]">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-2 text-[var(--on-surface-variant)]">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--on-primary)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
