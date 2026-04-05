"use client";

import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OnboardingError({
  error,
  reset,
}: ErrorProps): React.ReactElement {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: "var(--surface-container-lowest)",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--error-container)" }}
          >
            <span style={{ color: "var(--on-error-container)" }}>!</span>
          </div>
          <h2
            className="mb-2 text-lg font-bold"
            style={{ color: "var(--on-surface)" }}
          >
            온보딩 중 문제가 발생했습니다
          </h2>
          <p
            className="mb-6 text-sm"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {error.message || "잠시 후 다시 시도해주세요."}
          </p>
          <Button onClick={reset} variant="outline">
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}
