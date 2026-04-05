"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { completeOnboarding } from "../actions";

export function CompleteStep(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete(): Promise<void> {
    setLoading(true);
    setError(null);

    const result = await completeOnboarding();

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/products");
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* 체크 아이콘 */}
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "var(--secondary-container)" }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--on-secondary-container)" }}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2
        className="mb-3 text-2xl font-bold tracking-tight"
        style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
      >
        모든 준비가 완료되었습니다!
      </h2>

      <p
        className="mb-2 text-base leading-relaxed"
        style={{ color: "var(--on-surface-variant)" }}
      >
        쇼핑몰과 첫 상품이 등록되었습니다.
      </p>
      <p
        className="mb-8 text-sm"
        style={{ color: "var(--outline)" }}
      >
        대시보드에서 AI 최적화를 바로 실행해보세요.
      </p>

      {error && (
        <p className="mb-4 text-sm" style={{ color: "var(--error)" }}>
          {error}
        </p>
      )}

      <Button
        onClick={handleComplete}
        disabled={loading}
        className="w-full"
      >
        {loading ? "처리 중..." : "대시보드로 이동 →"}
      </Button>
    </div>
  );
}
