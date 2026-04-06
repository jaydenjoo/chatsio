"use client";

import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductsError({
  error,
  reset,
}: ErrorProps): ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div className="rounded-2xl bg-[var(--surface-container-lowest)] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--error-container)]">
            <span className="text-[var(--on-error-container)] font-bold">!</span>
          </div>
          <h2 className="mb-2 text-lg font-bold text-[var(--on-surface)]">
            상품 목록을 불러올 수 없습니다
          </h2>
          <p className="mb-6 text-sm text-[var(--on-surface-variant)]">
            잠시 후 다시 시도해주세요.
            {error.digest && (
              <span className="block mt-1 text-xs opacity-50">
                코드: {error.digest}
              </span>
            )}
          </p>
          <Button onClick={reset} variant="outline">
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}
