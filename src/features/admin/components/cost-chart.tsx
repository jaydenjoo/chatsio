"use client";

import { useState } from "react";
import type { DailyStat } from "@/features/admin/actions/cost-actions";

// ============================================================
// 타입
// ============================================================

interface CostChartProps {
  readonly stats: readonly DailyStat[];
}

type ViewMode = "calls" | "cost";

// ============================================================
// 헬퍼
// ============================================================

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ============================================================
// CostChart
// ============================================================

export function CostChart({ stats }: CostChartProps): React.ReactElement {
  const [mode, setMode] = useState<ViewMode>("calls");

  const maxValue = Math.max(
    1,
    ...stats.map((s) =>
      mode === "calls" ? s.basic + s.premium : s.totalCost,
    ),
  );

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[var(--shadow-sm)]">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-on-surface">
          일별 추이 (최근 30일)
        </h3>
        <div className="flex gap-1 rounded-lg bg-surface-container p-1">
          <button
            type="button"
            onClick={() => setMode("calls")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              mode === "calls"
                ? "bg-surface-container-lowest text-on-surface shadow-[var(--shadow-sm)]"
                : "text-on-surface-variant"
            }`}
          >
            호출 수
          </button>
          <button
            type="button"
            onClick={() => setMode("cost")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              mode === "cost"
                ? "bg-surface-container-lowest text-on-surface shadow-[var(--shadow-sm)]"
                : "text-on-surface-variant"
            }`}
          >
            추정 비용
          </button>
        </div>
      </div>

      {/* 범례 */}
      {mode === "calls" && (
        <div className="mb-4 flex gap-4 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#006195]" />
            Premium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#006195]/30" />
            Basic
          </span>
        </div>
      )}

      {/* 차트 */}
      <div className="flex h-[180px] items-end gap-[3px]">
        {stats.map((stat) => {
          const total = mode === "calls" ? stat.basic + stat.premium : stat.totalCost;
          const heightPct = maxValue > 0 ? (total / maxValue) * 100 : 0;

          // 호출 수 모드: 스택 바 (premium 위, basic 아래)
          const premiumPct =
            mode === "calls" && total > 0
              ? (stat.premium / (stat.basic + stat.premium)) * heightPct
              : 0;

          return (
            <div
              key={stat.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
            >
              {/* 툴팁 */}
              <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1a1e24] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-lg group-hover:block">
                {formatShortDate(stat.date)}
                {mode === "calls"
                  ? ` · ${stat.basic + stat.premium}건`
                  : ` · ₩${stat.totalCost.toLocaleString()}`}
              </div>

              {/* 바 */}
              {mode === "calls" ? (
                <div
                  className="flex w-full flex-col overflow-hidden rounded-t-sm"
                  style={{ height: `${heightPct}%`, minHeight: total > 0 ? 2 : 0 }}
                >
                  <div
                    className="w-full bg-[#006195] transition-all"
                    style={{ height: `${premiumPct > 0 ? (premiumPct / heightPct) * 100 : 0}%` }}
                  />
                  <div
                    className="w-full flex-1 bg-[#006195]/30 transition-all"
                  />
                </div>
              ) : (
                <div
                  className="w-full rounded-t-sm bg-[#2a9d5c] transition-all"
                  style={{ height: `${heightPct}%`, minHeight: total > 0 ? 2 : 0 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* X축 라벨 (7일 간격) */}
      <div className="mt-2 flex justify-between text-[10px] text-outline">
        {stats
          .filter((_, i) => i % 7 === 0 || i === stats.length - 1)
          .map((stat) => (
            <span key={stat.date}>{formatShortDate(stat.date)}</span>
          ))}
      </div>

      {/* 요약 */}
      <div className="mt-4 flex justify-between border-t border-outline-variant/10 pt-4 text-xs text-on-surface-variant">
        <span>
          30일 총 호출:{" "}
          <strong className="text-on-surface">
            {stats.reduce((s, d) => s + d.basic + d.premium, 0)}건
          </strong>
        </span>
        <span>
          30일 추정 비용:{" "}
          <strong className="text-on-surface">
            ₩{stats.reduce((s, d) => s + d.totalCost, 0).toLocaleString()}
          </strong>
        </span>
      </div>
    </div>
  );
}
