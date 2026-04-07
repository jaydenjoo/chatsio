"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Package,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { OptimizationDetail } from "../actions";
import { PLAN_LABEL } from "../validation";
import { OptimizationProgress } from "./optimization-progress";

interface OptimizationStatusProps {
  readonly initialOptimization: OptimizationDetail;
}

// 폴링 간격 — Realtime이 붙으면 이 폴링은 방어선 역할
const POLL_INTERVAL_MS = 5000;

// 진행 중인 status들 — 완료/실패 후에는 폴링 중단
const ACTIVE_STATUSES: ReadonlySet<OptimizationDetail["status"]> = new Set([
  "queued",
  "processing",
]);

// H3 — 외부(Realtime/폴링)에서 오는 status 값 whitelist
const VALID_STATUSES: ReadonlySet<OptimizationDetail["status"]> = new Set([
  "queued",
  "processing",
  "completed",
  "failed",
]);

// 폴링 쿼리 컬럼 — getOptimization과 동기화 유지
const POLL_SELECT_COLUMNS =
  "id, product_id, shop_id, plan, status, idempotency_key, result_json, jsonld, score, processing_step, error_step, error_message, failed_at, duration_ms, retry_count, created_at, updated_at";

export function OptimizationStatus({
  initialOptimization,
}: OptimizationStatusProps): ReactElement {
  const [optimization, setOptimization] =
    useState<OptimizationDetail>(initialOptimization);
  const router = useRouter();

  // M3 — supabase client를 컴포넌트 생애 동안 1회만 생성
  const supabase = useMemo(() => createClient(), []);

  // M3 — 최신 status를 ref로 추적 → effect 재실행 없이 active 여부 판단
  const statusRef = useRef<OptimizationDetail["status"]>(optimization.status);
  useEffect(() => {
    statusRef.current = optimization.status;
  }, [optimization.status]);

  // Realtime 구독 — id 기준 한 번만 구독. status 변화로 재구독하지 않는다.
  useEffect(() => {
    const channel = supabase
      .channel(`optimization:${optimization.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "optimizations",
          filter: `id=eq.${optimization.id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          // H1 — functional setState + null-safe diff 병합
          setOptimization((prev) => applyRowUpdate(payload.new, prev));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [optimization.id, supabase]);

  // 5초 폴링 — Realtime fallback. id 기준 1회만 인터벌 설정.
  useEffect(() => {
    const interval = setInterval(async () => {
      // 최신 status를 ref로 확인 — terminal 상태에서는 fetch 스킵
      if (!ACTIVE_STATUSES.has(statusRef.current)) return;

      const { data, error } = await supabase
        .from("optimizations")
        .select(POLL_SELECT_COLUMNS)
        .eq("id", optimization.id)
        .maybeSingle();

      if (error || !data) return;
      setOptimization((prev) =>
        applyRowUpdate(data as Record<string, unknown>, prev),
      );
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [optimization.id, supabase]);

  function handleRetry(): void {
    if (!optimization.product) return;
    // preselect로 다시 이동해서 사용자가 Plan을 다시 선택하도록
    router.push(`/optimize?productId=${optimization.product.id}`);
  }

  return (
    <div className="space-y-6">
      {/* 상단 — 상품 + Plan 뱃지 */}
      <OptimizationHeader optimization={optimization} />

      {/* 상태별 본문 */}
      <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] sm:p-8">
        {optimization.status === "queued" ||
        optimization.status === "processing" ? (
          <OptimizationProgress optimization={optimization} />
        ) : optimization.status === "completed" ? (
          <CompletedView optimization={optimization} />
        ) : (
          <FailedView optimization={optimization} onRetry={handleRetry} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Shared header
// ============================================================

function OptimizationHeader({
  optimization,
}: {
  readonly optimization: OptimizationDetail;
}): ReactElement {
  const product = optimization.product;
  const thumbnail = product?.imageUrls?.[0];

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-4">
      <Link
        href="/optimize"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
        aria-label="최적화 실행 페이지로 돌아가기"
      >
        <ArrowLeft className="size-4" />
      </Link>

      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-container-high)]">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-5 text-[var(--outline)]" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[var(--on-surface)]">
          {product?.name ?? "(상품 정보 없음)"}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--on-surface-variant)]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-fixed)]/40 px-2 py-0.5 font-bold text-[var(--primary)]">
            <Sparkles className="size-3" />
            {PLAN_LABEL[optimization.plan]}
          </span>
          <span>·</span>
          <span>
            ID {optimization.id.slice(0, 8)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Completed view — Task 2-3 에서는 raw JSON (Task 2-6에서 정식 UI)
// ============================================================

function CompletedView({
  optimization,
}: {
  readonly optimization: OptimizationDetail;
}): ReactElement {
  const durationLabel = optimization.durationMs
    ? optimization.durationMs < 60_000
      ? `${Math.round(optimization.durationMs / 1000)}초`
      : `${(optimization.durationMs / 60_000).toFixed(1)}분`
    : "-";

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--success)]/10 text-[var(--success)]">
          <CheckCircle2 className="size-7" />
        </div>
        <p className="text-lg font-bold text-[var(--on-surface)]">
          최적화가 완료되었습니다
        </p>
        <p className="text-sm text-[var(--on-surface-variant)]">
          소요 시간 {durationLabel}
          {optimization.score !== null && ` · 점수 ${optimization.score}점`}
        </p>
      </div>

      {/* 결과 미리보기 — Task 2-6에서 정식 UI로 교체 */}
      <div className="rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--on-surface-variant)]">
            결과 JSON (개발용 미리보기)
          </p>
          <span className="text-[10px] text-[var(--outline)]">
            Task 2-6에서 정식 UI로 교체 예정
          </span>
        </div>
        <pre className="max-h-96 overflow-auto rounded-lg bg-[var(--surface-container-lowest)] p-3 text-[11px] leading-relaxed text-[var(--on-surface)]">
          {JSON.stringify(optimization.resultJson, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ============================================================
// Failed view — 에러 단계 + 메시지 + 다시 시도
// ============================================================

function FailedView({
  optimization,
  onRetry,
}: {
  readonly optimization: OptimizationDetail;
  readonly onRetry: () => void;
}): ReactElement {
  const stepLabel = optimization.errorStep ?? "알 수 없는 단계";
  const message =
    optimization.errorMessage ?? "최적화 실행 중 오류가 발생했습니다.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--error)]/10 text-[var(--error)]">
          <AlertCircle className="size-7" />
        </div>
        <p className="text-lg font-bold text-[var(--on-surface)]">
          최적화에 실패했습니다
        </p>
        <p className="text-sm text-[var(--on-surface-variant)]">
          잠시 후 다시 시도하거나 관리자에게 문의해주세요
        </p>
      </div>

      {/* 에러 상세 */}
      <div className="rounded-xl border border-[var(--error)]/40 bg-[var(--error)]/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[var(--error)]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--error)]">
            단계: {stepLabel}
          </span>
        </div>
        <p className="text-sm text-[var(--error)]">{message}</p>
      </div>

      {/* 액션 */}
      <div className="flex justify-center">
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="size-4" />
          다시 시도
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Realtime/폴링 공통: snake_case → camelCase 변환 (pure function)
//
// H1 — `??`는 null도 "값 없음"으로 착각해서 n8n이 명시적으로 null을
// 쓰는 필드(error_step 리셋 등)를 stale로 덮어쓴다. 수정: 필드가
// undefined(=row에 아예 없음)인 경우에만 prev 유지, null이면 업데이트.
//
// H3 — status는 whitelist 검증 후에만 반영. 예상 밖 값은 무시.
// ============================================================

function pickNullable<T>(raw: unknown, prevValue: T): T {
  return raw !== undefined ? (raw as T) : prevValue;
}

function applyRowUpdate(
  row: Record<string, unknown>,
  prev: OptimizationDetail,
): OptimizationDetail {
  const rawStatus = row.status;
  const status: OptimizationDetail["status"] =
    typeof rawStatus === "string" &&
    VALID_STATUSES.has(rawStatus as OptimizationDetail["status"])
      ? (rawStatus as OptimizationDetail["status"])
      : prev.status;

  return {
    ...prev,
    status,
    resultJson: pickNullable<Record<string, unknown> | null>(
      row.result_json,
      prev.resultJson,
    ),
    jsonld: pickNullable<Record<string, unknown> | null>(
      row.jsonld,
      prev.jsonld,
    ),
    score: pickNullable<number | null>(row.score, prev.score),
    processingStep: pickNullable<number | null>(
      row.processing_step,
      prev.processingStep,
    ),
    errorStep: pickNullable<string | null>(row.error_step, prev.errorStep),
    errorMessage: pickNullable<string | null>(
      row.error_message,
      prev.errorMessage,
    ),
    failedAt: pickNullable<string | null>(row.failed_at, prev.failedAt),
    durationMs: pickNullable<number | null>(row.duration_ms, prev.durationMs),
    updatedAt:
      typeof row.updated_at === "string" ? row.updated_at : prev.updatedAt,
  };
}
