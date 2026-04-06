"use client";

import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function NewProductError({
  error,
  reset,
}: ErrorProps): ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div
          className="rounded-2xl bg-[var(--surface-container-lowest)] p-6 sm:p-8"
          style={{
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--error-container)]">
            <span className="font-bold text-[var(--on-error-container)]">!</span>
          </div>
          <h2 className="mb-2 text-lg font-bold text-[var(--on-surface)]">
            페이지를 불러올 수 없습니다
          </h2>
          <p className="mb-6 text-sm text-[var(--on-surface-variant)]">
            잠시 후 다시 시도해주세요.
            {error.digest && (
              <span className="mt-1 block text-xs opacity-50">
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
