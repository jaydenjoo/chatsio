import Link from "next/link";
import { z } from "zod/v4";
import { PageHeader } from "@/components/shared";
import { createClient } from "@/lib/supabase/server";
import type { LogLevel, PipelineEventRow } from "@/lib/monitoring/types";

/**
 * /admin/events — 파이프라인 이벤트 조회 (Task 2-M-B-2)
 *
 * 설계:
 *   - Server Component. `(admin)/layout.tsx`가 이미 매 요청 admin 검증 →
 *     본 페이지는 데이터 조회만 담당 (중복 검증 불필요).
 *   - RLS 경로 (`createClient()` 쿠키 기반) 사용. `pipeline_events` RLS
 *     SELECT 정책은 `public.is_admin()` SECURITY DEFINER 헬퍼를 호출하므로
 *     admin 계정은 통과, member는 차단됨 → 방어 계층 일관성.
 *   - 필터는 native `<form method="get">`으로 처리 → Server Component 친화.
 *   - 페이지네이션은 `offset` 쿼리스트링 + `Link` 이동.
 *
 * context_id 불일치 주의 (B-1 Consider (b) 기록):
 *   `optimize/actions.ts`의 `run_start` 이벤트는 contextId=productId를,
 *   `run_success` 이벤트는 contextId=optimizationId를 기록한다. 현재는
 *   이 테이블에서 raw 값만 표기하며, 불일치를 UI 레벨에서 별도 구분하지
 *   않는다. V2에서 정책 통일(권장: optimizationId 우선) 시 마이그레이션.
 *
 * MVP 범위 제외:
 *   - 차트 / Realtime 구독 / CSV export / 풀텍스트 검색 / context 링크
 *   - error_stack 본문 표시 (select에서 제외 → row payload 절감)
 */

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

const SearchParamsSchema = z.object({
  level: z.enum(["all", "debug", "info", "warn", "error"]).default("all"),
  service: z.enum(["all", "next-app", "n8n"]).default("all"),
  offset: z.coerce.number().int().min(0).default(0),
});

type Filters = z.infer<typeof SearchParamsSchema>;

interface EventsPageProps {
  readonly searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}

/**
 * level별 배지 색상 — Tailwind 내장 팔레트.
 *
 * `Record<LogLevel, string>`으로 키를 강제 → `LogLevel` union에 새 값이
 * 추가되면 TS 컴파일 에러로 조기 검출 (code-reviewer Consider (d) 반영).
 * DB에 enum 외 값이 들어오는 경우는 아래 `getBadgeClass`의 fallback으로
 * 런타임 안전 보장.
 */
const LEVEL_BADGE_CLASSES: Record<LogLevel, string> = {
  error: "bg-red-100 text-red-700",
  warn: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-700",
  debug: "bg-gray-100 text-gray-700",
};

const BADGE_FALLBACK_CLASS = "bg-gray-100 text-gray-700";

function getBadgeClass(level: string): string {
  // in 연산자로 runtime narrow — DB가 enum 바깥 값을 반환해도 안전.
  if (level in LEVEL_BADGE_CLASSES) {
    return LEVEL_BADGE_CLASSES[level as LogLevel];
  }
  return BADGE_FALLBACK_CLASS;
}

function formatKST(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * UI 표시용 메시지 축약 — `@/lib/monitoring/log-event.ts`의 `truncate()`와
 * 의도적으로 다르다. DB 저장용은 `…[truncated]` 라벨을 붙여 원본과 절단본을
 * 구분하지만, 이 함수는 테이블 행 높이를 맞추기 위한 순수 포맷이므로 라벨을
 * 붙이지 않는다. 원본 메시지는 DB에 그대로 보존되어 있다.
 */
function truncateMessage(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max) + "…";
}

function buildPageHref(filters: Filters, nextOffset: number): string {
  const params = new URLSearchParams();
  if (filters.level !== "all") {
    params.set("level", filters.level);
  }
  if (filters.service !== "all") {
    params.set("service", filters.service);
  }
  if (nextOffset > 0) {
    params.set("offset", String(nextOffset));
  }
  const qs = params.toString();
  return qs ? `/admin/events?${qs}` : "/admin/events";
}

function parseFilters(
  raw: Record<string, string | string[] | undefined>,
): Filters {
  const parsed = SearchParamsSchema.safeParse({
    level: typeof raw.level === "string" ? raw.level : undefined,
    service: typeof raw.service === "string" ? raw.service : undefined,
    offset: typeof raw.offset === "string" ? raw.offset : undefined,
  });

  // 잘못된 필터 값은 조용히 기본값으로 fallback (URL 직접 조작 방어).
  return parsed.success
    ? parsed.data
    : { level: "all", service: "all", offset: 0 };
}

export default async function AdminEventsPage({
  searchParams,
}: EventsPageProps): Promise<React.ReactElement> {
  const raw = await searchParams;
  const filters = parseFilters(raw);

  const supabase = await createClient();

  // select 컬럼 명시 — `error_stack`은 이번 MVP에서 표시하지 않으므로 제외
  // (row 페이로드 절감 + V2 상세 페이지로 이연).
  //
  // count: "exact" 필수 — 아래 hasNext 계산은 정확한 total을 요구한다.
  // "estimated"로 바꾸면 페이지 경계에서 hasNext가 잘못 계산될 수 있다
  // (code-reviewer Consider (b)).
  let query = supabase
    .from("pipeline_events")
    .select(
      "id, created_at, service, level, context_type, context_id, step, message",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(filters.offset, filters.offset + PAGE_SIZE - 1);

  if (filters.level !== "all") {
    query = query.eq("level", filters.level);
  }
  if (filters.service !== "all") {
    query = query.eq("service", filters.service);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error(
      "[AdminEventsPage] pipeline_events 조회 실패:",
      error.message,
    );
    // Error Boundary(`error.tsx`)로 전파 → 관측 + 사용자 메시지.
    throw new Error("이벤트 목록을 불러오지 못했습니다.");
  }

  const rows: readonly PipelineEventRow[] = (data ?? []) as PipelineEventRow[];
  const total = count ?? 0;
  const startIndex = total === 0 ? 0 : filters.offset + 1;
  const endIndex = Math.min(filters.offset + rows.length, total);
  const hasPrev = filters.offset > 0;
  const hasNext = filters.offset + PAGE_SIZE < total;

  return (
    <div className="space-y-6">
      <PageHeader
        title="이벤트 로그"
        description="파이프라인 이벤트를 시간 역순으로 조회합니다. (Task 2-M)"
      />

      {/* 필터 폼 */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-2xl bg-[var(--surface-container-lowest)] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--on-surface-variant)]">레벨</span>
          <select
            name="level"
            defaultValue={filters.level}
            className="rounded-md border border-[var(--outline-variant)] bg-white px-3 py-2 text-[var(--on-surface)]"
          >
            <option value="all">전체</option>
            <option value="error">error</option>
            <option value="warn">warn</option>
            <option value="info">info</option>
            <option value="debug">debug</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--on-surface-variant)]">서비스</span>
          <select
            name="service"
            defaultValue={filters.service}
            className="rounded-md border border-[var(--outline-variant)] bg-white px-3 py-2 text-[var(--on-surface)]"
          >
            <option value="all">전체</option>
            <option value="next-app">next-app</option>
            <option value="n8n">n8n</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--on-primary)] shadow-sm transition-opacity hover:opacity-90"
        >
          필터 적용
        </button>
        <Link
          href="/admin/events"
          className="rounded-md border border-[var(--outline-variant)] px-4 py-2 text-sm text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]"
        >
          초기화
        </Link>
      </form>

      {/* 결과 요약 */}
      <div className="text-sm text-[var(--on-surface-variant)]">
        {total > 0
          ? `${total.toLocaleString()}건 중 ${startIndex.toLocaleString()}–${endIndex.toLocaleString()}건 표시`
          : "조건에 맞는 이벤트가 없습니다."}
      </div>

      {/* 테이블 */}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-[var(--surface-container-lowest)] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--surface-container)] text-left text-xs uppercase tracking-wider text-[var(--on-surface-variant)]">
              <tr>
                <th className="px-4 py-3 font-semibold">시간 (KST)</th>
                <th className="px-4 py-3 font-semibold">레벨</th>
                <th className="px-4 py-3 font-semibold">서비스</th>
                <th className="px-4 py-3 font-semibold">컨텍스트</th>
                <th className="px-4 py-3 font-semibold">스텝</th>
                <th className="px-4 py-3 font-semibold">메시지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline-variant)]">
              {rows.map((row) => {
                const badgeClass = getBadgeClass(row.level);
                const contextLabel = row.context_type
                  ? row.context_id
                    ? `${row.context_type}:${row.context_id.slice(0, 8)}`
                    : row.context_type
                  : "—";

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-[var(--surface-container)]/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--on-surface-variant)]">
                      {formatKST(row.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}
                      >
                        {row.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.service}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--on-surface-variant)]">
                      {contextLabel}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.step ?? "—"}
                    </td>
                    <td className="max-w-lg px-4 py-3 text-[var(--on-surface)]">
                      {truncateMessage(row.message, 120)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {(hasPrev || hasNext) && (
        <div className="flex items-center justify-between">
          {hasPrev ? (
            <Link
              href={buildPageHref(
                filters,
                Math.max(0, filters.offset - PAGE_SIZE),
              )}
              className="rounded-md border border-[var(--outline-variant)] px-4 py-2 text-sm hover:bg-[var(--surface-container)]"
            >
              ← 이전
            </Link>
          ) : (
            <span />
          )}
          {hasNext ? (
            <Link
              href={buildPageHref(filters, filters.offset + PAGE_SIZE)}
              className="rounded-md border border-[var(--outline-variant)] px-4 py-2 text-sm hover:bg-[var(--surface-container)]"
            >
              다음 →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
