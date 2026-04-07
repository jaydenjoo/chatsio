"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  PLAN_ESTIMATED_SECONDS,
  PROCESSING_STEP_LABELS,
} from "../validation";
import type { OptimizationDetail } from "../actions";

interface OptimizationProgressProps {
  readonly optimization: OptimizationDetail;
}

const STEP_COUNT = 4;

export function OptimizationProgress({
  optimization,
}: OptimizationProgressProps): ReactElement {
  const estimatedSec = PLAN_ESTIMATED_SECONDS[optimization.plan];
  const startedAt = new Date(optimization.createdAt).getTime();

  // 경과 시간을 1초마다 업데이트 (n8n의 processing_step과 병행)
  const [elapsedSec, setElapsedSec] = useState<number>(() =>
    Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  // n8n이 processing_step을 쓰면 그 값을 우선, 없으면 시간 기반 추정
  const timeBasedStep = Math.min(
    STEP_COUNT,
    Math.max(1, Math.ceil((elapsedSec / estimatedSec) * STEP_COUNT)),
  );
  const currentStep = optimization.processingStep ?? timeBasedStep;
  const clampedStep = Math.min(STEP_COUNT, Math.max(1, currentStep));
  const progressPct = Math.min(
    100,
    Math.round((Math.min(elapsedSec, estimatedSec) / estimatedSec) * 100),
  );

  const remainingSec = Math.max(0, estimatedSec - elapsedSec);
  const remainingLabel =
    remainingSec === 0
      ? "거의 완료되었습니다"
      : remainingSec < 60
        ? `약 ${remainingSec}초 남음`
        : `약 ${Math.ceil(remainingSec / 60)}분 남음`;

  return (
    <div className="space-y-8">
      {/* 헤더 — 예상 시간 + 경과 */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--primary-fixed)]/40 text-[var(--primary)]">
          <Loader2 className="size-6 animate-spin" />
        </div>
        <p className="text-base font-bold text-[var(--on-surface)]">
          AI 최적화를 처리하고 있습니다
        </p>
        <p className="text-sm text-[var(--on-surface-variant)]">
          {remainingLabel} · {elapsedSec}초 경과
        </p>
      </div>

      {/* 프로그레스 바 */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-[var(--on-surface-variant)]">
          <span>진행률</span>
          <span className="text-[var(--primary)]">{progressPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-container-high)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-container)] transition-all duration-1000 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 4단계 표시 */}
      <ol className="space-y-3">
        {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map((step) => {
          const label = PROCESSING_STEP_LABELS[step] ?? `단계 ${step}`;
          const state: "done" | "active" | "pending" =
            step < clampedStep
              ? "done"
              : step === clampedStep
                ? "active"
                : "pending";
          return <StepRow key={step} step={step} label={label} state={state} />;
        })}
      </ol>

      {/* 안내 배너 */}
      <div className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-4 text-xs text-[var(--on-surface-variant)]">
        💡 이 페이지를 떠나도 최적화는 백그라운드에서 계속 진행됩니다. 완료되면
        상태가 자동으로 업데이트됩니다.
      </div>
    </div>
  );
}

interface StepRowProps {
  readonly step: number;
  readonly label: string;
  readonly state: "done" | "active" | "pending";
}

function StepRow({ step, label, state }: StepRowProps): ReactElement {
  return (
    <li className="flex items-center gap-3">
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          state === "done"
            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]"
            : state === "active"
              ? "border-[var(--primary)] bg-[var(--primary-fixed)]/60 text-[var(--primary)]"
              : "border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-[var(--outline)]"
        }`}
      >
        {state === "done" ? (
          <Check className="size-4" strokeWidth={3} />
        ) : state === "active" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <span className="text-xs font-bold">{step}</span>
        )}
      </div>
      <span
        className={`text-sm font-semibold ${
          state === "pending"
            ? "text-[var(--on-surface-variant)]"
            : "text-[var(--on-surface)]"
        }`}
      >
        {label}
      </span>
    </li>
  );
}
