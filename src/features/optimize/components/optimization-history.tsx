"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { Clock, FileSearch } from "lucide-react";
import type { OptimizationHistoryItem } from "../actions";

interface OptimizationHistoryProps {
  readonly items: readonly OptimizationHistoryItem[];
}

const STATUS_CONFIG: Record<
  OptimizationHistoryItem["status"],
  { label: string; className: string }
> = {
  completed: {
    label: "완료",
    className:
      "bg-[var(--success)]/10 text-[var(--success)]",
  },
  failed: {
    label: "실패",
    className:
      "bg-[var(--error)]/10 text-[var(--error)]",
  },
  processing: {
    label: "처리 중",
    className:
      "bg-[var(--warning)]/10 text-[var(--warning)]",
  },
  queued: {
    label: "대기",
    className:
      "bg-[var(--outline)]/10 text-[var(--outline)]",
  },
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "-";
  if (ms < 60_000) return `${Math.round(ms / 1000)}초`;
  return `${(ms / 60_000).toFixed(1)}분`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

export function OptimizationHistory({
  items,
}: OptimizationHistoryProps): ReactElement {
  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-3xl bg-[var(--surface-container-lowest)] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
      {/* 헤더 */}
      <div className="hidden items-center gap-4 border-b border-[var(--outline-variant)]/30 px-6 py-3 sm:flex">
        <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
          상품명
        </div>
        <div className="w-20 text-center text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
          플랜
        </div>
        <div className="w-20 text-center text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
          상태
        </div>
        <div className="w-16 text-center text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
          점수
        </div>
        <div className="w-20 text-center text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
          소요시간
        </div>
        <div className="w-24 text-right text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
          일시
        </div>
      </div>

      {/* 행 목록 */}
      <div className="divide-y divide-[var(--outline-variant)]/20">
        {items.map((item) => {
          const statusCfg = STATUS_CONFIG[item.status];
          return (
            <Link
              key={item.id}
              href={`/optimize/${item.id}`}
              className="flex flex-col gap-2 px-6 py-4 transition-colors hover:bg-[var(--surface-container-low)] sm:flex-row sm:items-center sm:gap-4"
            >
              {/* 상품명 */}
              <div className="flex-1 text-sm font-semibold text-[var(--on-surface)] sm:truncate">
                {item.productName}
              </div>

              {/* 모바일: 하단 메타 정보 */}
              <div className="flex items-center gap-3 sm:contents">
                {/* 플랜 */}
                <span className="w-20 text-center text-xs font-bold uppercase text-[var(--primary)]">
                  {item.plan}
                </span>

                {/* 상태 */}
                <span
                  className={`inline-flex w-20 justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.className}`}
                >
                  {statusCfg.label}
                </span>

                {/* 점수 */}
                <span className="w-16 text-center text-sm font-bold text-[var(--on-surface)]">
                  {item.score ?? "-"}
                </span>

                {/* 소요시간 */}
                <span className="w-20 text-center text-xs text-[var(--on-surface-variant)]">
                  {formatDuration(item.durationMs)}
                </span>

                {/* 일시 */}
                <span className="w-24 text-right text-xs text-[var(--on-surface-variant)]">
                  {formatDate(item.createdAt)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState(): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-[var(--surface-container-lowest)] p-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--surface-container)] text-[var(--outline)]">
        <FileSearch className="size-6" />
      </div>
      <p className="text-base font-bold text-[var(--on-surface)]">
        아직 최적화 이력이 없습니다
      </p>
      <p className="max-w-sm text-sm text-[var(--on-surface-variant)]">
        상품을 선택하고 AI 최적화를 실행하면 이곳에 이력이 표시됩니다.
      </p>
      <Link
        href="/optimize"
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] px-5 py-2.5 text-sm font-bold text-[var(--on-primary)] shadow-md transition-transform hover:scale-[1.02]"
      >
        <Clock className="size-4" />
        최적화 실행하기
      </Link>
    </div>
  );
}
