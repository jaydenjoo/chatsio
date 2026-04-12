"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  readonly error: Error;
  readonly reset: () => void;
}

export default function OptimizeHistoryError({
  error,
  reset,
}: ErrorProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-[var(--surface-container-lowest)] p-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--error)]/10 text-[var(--error)]">
        <AlertTriangle className="size-6" />
      </div>
      <p className="text-base font-bold text-[var(--on-surface)]">
        이력을 불러오지 못했습니다
      </p>
      <p className="max-w-sm text-sm text-[var(--on-surface-variant)]">
        {error.message}
      </p>
      <Button
        onClick={reset}
        className="mt-2 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)]"
      >
        다시 시도
      </Button>
    </div>
  );
}
