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
