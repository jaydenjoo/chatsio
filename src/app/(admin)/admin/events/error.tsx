"use client";

import { useEffect } from "react";

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function EventsError({
  error,
  reset,
}: ErrorProps): React.ReactElement {
  useEffect(() => {
    // 서버 측에서 이미 console.error로 기록됨. 클라이언트 측에서도 관측.
    console.error("[AdminEventsPage] error boundary:", error);
  }, [error]);

  return (
    <div className="rounded-2xl bg-[var(--surface-container-lowest)] p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
      <h2 className="text-section text-on-surface">이벤트 로드 실패</h2>
      <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
        일시적인 문제일 수 있습니다. 다시 시도해주세요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--on-primary)] shadow-sm transition-opacity hover:opacity-90"
      >
        다시 시도
      </button>
    </div>
  );
}
