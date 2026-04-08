/**
 * Chatsio 통합 모니터링 타입 — Task 2-M-B-1
 *
 * pipeline_events 테이블 스키마와 1:1 대응. service_role 경로와
 * 향후 `POST /api/v1/internal/log-event` (B-2) 양쪽에서 공용.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogService = "next-app" | "n8n";

/**
 * logEvent 호출 입력 — 모든 필드가 readonly (immutability).
 *
 * context_type / context_id는 느슨한 문자열로 둔다. 엔티티가 다양
 * (optimization / product / auth / onboarding) 하고 FK 제약도 없어
 * 오타 리스크는 있지만, 확장 유연성이 더 중요.
 */
export interface LogEventInput {
  readonly service: LogService;
  readonly level: LogLevel;
  readonly message: string;
  readonly contextType?: string | null;
  readonly contextId?: string | null;
  readonly step?: string | null;
  readonly errorStack?: string | null;
  readonly userId?: string | null;
  readonly shopId?: string | null;
}

/**
 * pipeline_events 테이블 row의 조회 전용 shape.
 *
 * 현재 Supabase Database 타입을 `supabase gen types`로 생성하지 않기 때문에
 * SELECT 결과는 SDK가 `any[]`에 가까운 형태로 추론한다. 조회측(`/admin/events`
 * 등)에서 일관된 row 모양을 쓰기 위해 여기에 한 번만 정의한다.
 *
 * 주의: `error_stack` 컬럼은 MVP 조회 UI에서 제외되어 있으며, 이 타입은
 * 조회 UI에서 실제 select하는 컬럼들만 포함한다. 상세 페이지 등에서
 * error_stack이 필요해지면 확장 shape를 별도로 정의하거나 이 타입에 추가.
 */
export interface PipelineEventRow {
  readonly id: string;
  readonly created_at: string;
  readonly service: string;
  readonly level: string;
  readonly context_type: string | null;
  readonly context_id: string | null;
  readonly step: string | null;
  readonly message: string;
}
