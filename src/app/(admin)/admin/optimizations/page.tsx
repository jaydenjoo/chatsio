import Link from "next/link";
import { Activity } from "lucide-react";
import type { ReactElement } from "react";
import { StatusBadge } from "@/components/shared";
import { createClient } from "@/lib/supabase/server";
import type { BadgeStatus } from "@/types/components";

const STATUS_MAP: Record<string, { label: string; badge: BadgeStatus }> = {
  queued: { label: "대기", badge: "pending" },
  processing: { label: "처리중", badge: "processing" },
  completed: { label: "완료", badge: "success" },
  failed: { label: "실패", badge: "error" },
};

const VALID_STATUSES = ["queued", "processing", "completed", "failed"] as const;
const STATUS_OPTIONS = ["all", ...VALID_STATUSES];

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}초`;
}

interface OptimizationRow {
  id: string;
  plan: string;
  status: string;
  duration_ms: number | null;
  error_message: string | null;
  error_step: string | null;
  created_at: string;
  products: { name: string } | null;
  shops: { name: string } | null;
}

export default async function AdminOptimizationsPage(props: {
  searchParams: Promise<{ status?: string; page?: string }>;
}): Promise<ReactElement> {
  const { status: filterStatus, page: pageParam } = await props.searchParams;
  const supabase = await createClient();
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const limit = 20;
  const offset = (currentPage - 1) * limit;

  let query = supabase
    .from("optimizations")
    .select(
      "id, plan, status, duration_ms, error_message, error_step, created_at, products(name), shops(name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const safeStatus =
    filterStatus && VALID_STATUSES.includes(filterStatus as (typeof VALID_STATUSES)[number])
      ? filterStatus
      : undefined;

  if (safeStatus) {
    query = query.eq("status", safeStatus);
  }

  const { data: optimizations, count, error } = await query;

  if (error) {
    console.error("[AdminOptimizations] query failed:", error.message);
  }

  const rows = (optimizations ?? []) as unknown as OptimizationRow[];
  const totalPages = Math.ceil((count ?? 0) / limit);

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
          최적화 모니터링
        </h1>
        <p className="mt-1 text-on-surface-variant">
          전체 최적화 실행 로그와 상태를 확인합니다.
        </p>
      </div>

      {/* 필터 */}
      <form method="get" className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-on-surface-variant">
          상태:
        </span>
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => {
            const isActive = s === (filterStatus ?? "all");
            return (
              <button
                key={s}
                type="submit"
                name="status"
                value={s}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-[#006195] text-white"
                    : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {s === "all" ? "전체" : (STATUS_MAP[s]?.label ?? s)}
              </button>
            );
          })}
        </div>
        <span className="ml-auto text-sm text-outline">총 {count ?? 0}건</span>
      </form>

      {/* 테이블 */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-lowest py-16 text-center">
          <Activity className="mb-4 h-10 w-10 text-outline" />
          <h3 className="text-lg font-bold text-on-surface">
            최적화 기록이 없습니다
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            최적화를 실행하면 여기에 로그가 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[var(--shadow-sm)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 text-xs font-bold uppercase tracking-wider text-outline">
                <th className="px-6 py-4">시간</th>
                <th className="px-6 py-4">쇼핑몰</th>
                <th className="hidden px-6 py-4 md:table-cell">상품</th>
                <th className="px-6 py-4 text-center">플랜</th>
                <th className="px-6 py-4 text-center">상태</th>
                <th className="hidden px-6 py-4 text-right md:table-cell">
                  소요시간
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((opt) => {
                const statusInfo = STATUS_MAP[opt.status] ?? {
                  label: opt.status,
                  badge: "info" as BadgeStatus,
                };
                return (
                  <tr
                    key={opt.id}
                    className="border-b border-outline-variant/5 transition-colors hover:bg-surface-container-low/50"
                  >
                    <td className="px-6 py-4 text-on-surface-variant">
                      {formatDateTime(opt.created_at)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-on-surface">
                      {opt.shops?.name ?? "—"}
                    </td>
                    <td className="hidden max-w-[200px] truncate px-6 py-4 text-on-surface-variant md:table-cell">
                      {opt.products?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
                          opt.plan === "premium"
                            ? "bg-[#006195]/10 text-[#006195]"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {opt.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge
                        status={statusInfo.badge}
                        label={statusInfo.label}
                        size="sm"
                      />
                      {opt.status === "failed" && opt.error_step ? (
                        <p className="mt-1 text-[10px] text-error">
                          {opt.error_step}
                        </p>
                      ) : null}
                    </td>
                    <td className="hidden px-6 py-4 text-right text-on-surface-variant md:table-cell">
                      {formatDuration(opt.duration_ms)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          {currentPage > 1 ? (
            <Link
              href={`/admin/optimizations?status=${filterStatus ?? "all"}&page=${currentPage - 1}`}
              className="rounded-lg bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant shadow-[var(--shadow-sm)] hover:bg-surface-container-high"
            >
              이전
            </Link>
          ) : null}
          <span className="px-3 text-sm text-outline">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link
              href={`/admin/optimizations?status=${filterStatus ?? "all"}&page=${currentPage + 1}`}
              className="rounded-lg bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant shadow-[var(--shadow-sm)] hover:bg-surface-container-high"
            >
              다음
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
