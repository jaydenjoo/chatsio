"use client";

import type { ReactElement } from "react";
import { Check, Clock, Sparkles, Zap } from "lucide-react";
import type { OptimizationPlan } from "../validation";
import { PLAN_ESTIMATED_SECONDS } from "../validation";

interface PlanPickerProps {
  readonly selectedPlan: OptimizationPlan;
  readonly onSelect: (plan: OptimizationPlan) => void;
}

interface PlanSpec {
  readonly id: OptimizationPlan;
  readonly label: string;
  readonly subtitle: string;
  readonly icon: ReactElement;
  readonly features: readonly string[];
  readonly highlight?: boolean;
}

const PLAN_SPECS: readonly PlanSpec[] = [
  {
    id: "basic",
    label: "Basic",
    subtitle: "핵심 필드 빠르게",
    icon: <Zap className="size-5" />,
    features: [
      "제목/설명/키워드 최적화",
      "상위 3개 FAQ 생성",
      "JSON-LD 기본 구조 생성",
    ],
  },
  {
    id: "premium",
    label: "Premium",
    subtitle: "전체 필드 + 품질 검수",
    icon: <Sparkles className="size-5" />,
    highlight: true,
    features: [
      "Basic 전체 + use cases / 비교 데이터",
      "FAQ 최대 10건 + 구매 가이드",
      "Opus 품질 검수 1회 포함",
    ],
  },
];

export function PlanPicker({
  selectedPlan,
  onSelect,
}: PlanPickerProps): ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label="최적화 플랜 선택"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {PLAN_SPECS.map((spec) => (
        <PlanCard
          key={spec.id}
          spec={spec}
          selected={spec.id === selectedPlan}
          onClick={() => onSelect(spec.id)}
        />
      ))}
    </div>
  );
}

interface PlanCardProps {
  readonly spec: PlanSpec;
  readonly selected: boolean;
  readonly onClick: () => void;
}

function PlanCard({ spec, selected, onClick }: PlanCardProps): ReactElement {
  const estSec = PLAN_ESTIMATED_SECONDS[spec.id];
  const estLabel =
    estSec < 60 ? `약 ${estSec}초` : `약 ${Math.round(estSec / 60)}분`;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`group relative flex flex-col gap-4 rounded-2xl border-2 p-6 text-left transition-all ${
        selected
          ? "border-[var(--primary)] bg-[var(--primary-fixed)]/40 shadow-[0_4px_12px_rgba(0,0,0,0.03),0_12px_32px_rgba(0,0,0,0.08)]"
          : "border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] hover:border-[var(--primary)]/40 hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]"
      }`}
    >
      {/* highlight 뱃지 */}
      {spec.highlight && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--on-primary)] shadow-sm">
          추천
        </span>
      )}

      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-xl ${
              selected
                ? "bg-[var(--primary)] text-[var(--on-primary)]"
                : "bg-[var(--primary-fixed)]/40 text-[var(--primary)]"
            }`}
          >
            {spec.icon}
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-[var(--on-surface)]">
              {spec.label}
            </p>
            <p className="text-xs text-[var(--on-surface-variant)]">
              {spec.subtitle}
            </p>
          </div>
        </div>

        {/* 선택 체크 */}
        <div
          className={`flex size-6 items-center justify-center rounded-full border-2 transition-all ${
            selected
              ? "border-[var(--primary)] bg-[var(--primary)]"
              : "border-[var(--outline)]"
          }`}
          aria-hidden="true"
        >
          {selected && (
            <Check className="size-3.5 text-[var(--on-primary)]" strokeWidth={3} />
          )}
        </div>
      </div>

      {/* 예상 시간 */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--on-surface-variant)]">
        <Clock className="size-3.5" />
        <span>예상 소요 {estLabel}</span>
      </div>

      {/* 기능 리스트 */}
      <ul className="space-y-1.5 text-xs text-[var(--on-surface-variant)]">
        {spec.features.map((feat) => (
          <li key={feat} className="flex items-start gap-1.5">
            <Check
              className={`mt-0.5 size-3.5 shrink-0 ${
                selected ? "text-[var(--primary)]" : "text-[var(--outline)]"
              }`}
              strokeWidth={3}
            />
            <span>{feat}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}
