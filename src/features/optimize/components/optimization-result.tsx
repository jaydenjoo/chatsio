"use client";

import { useState, type ReactElement } from "react";
import { CheckCircle2, LayoutList, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OptimizationDetail } from "../actions";
import { AttributeList } from "./attribute-list";
import { JsonldPreview } from "./jsonld-preview";
import { QualityScoreRing } from "./quality-score-ring";

interface OptimizationResultProps {
  readonly optimization: OptimizationDetail;
}

type ActiveTab = "attributes" | "jsonld";

interface TabConfig {
  readonly id: ActiveTab;
  readonly label: string;
  readonly icon: typeof LayoutList;
}

const TABS: readonly TabConfig[] = [
  { id: "attributes", label: "속성 목록", icon: LayoutList },
  { id: "jsonld", label: "JSON-LD 코드", icon: Code2 },
];

function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return "-";
  if (durationMs < 60_000) {
    return `${Math.round(durationMs / 1000)}초`;
  }
  return `${(durationMs / 60_000).toFixed(1)}분`;
}

export function OptimizationResult({
  optimization,
}: OptimizationResultProps): ReactElement {
  const [activeTab, setActiveTab] = useState<ActiveTab>("attributes");

  const durationLabel = formatDuration(optimization.durationMs);

  return (
    <div className="space-y-6">
      {/* 완료 헤더 + 품질 스코어 카드 */}
      <div className="rounded-3xl bg-gradient-to-br from-[var(--surface-container-lowest)] to-[var(--surface-container-low)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <QualityScoreRing score={optimization.score} />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-[var(--success)]" />
                <p
                  className="text-lg font-bold tracking-tight text-[var(--on-surface)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  최적화 완료
                </p>
              </div>
              <p className="text-sm text-[var(--on-surface-variant)]">
                소요 시간 {durationLabel}
              </p>
              <p className="text-xs text-[var(--outline)]">
                ID {optimization.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 바 */}
      <div className="flex w-fit items-center gap-1 rounded-2xl bg-[var(--surface-container-low)] p-1.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all",
                isActive
                  ? "bg-[var(--surface-container-lowest)] text-[var(--primary)] shadow-sm"
                  : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-lowest)]/50",
              )}
              aria-selected={isActive}
              role="tab"
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      <div role="tabpanel">
        {activeTab === "attributes" ? (
          <AttributeList resultJson={optimization.resultJson} />
        ) : (
          <JsonldPreview jsonld={optimization.jsonld} />
        )}
      </div>
    </div>
  );
}
