/**
 * n8n webhook 호출 관련 에러 타입.
 *
 * runOptimization Server Action에서 이 에러들을 구분해서 처리한다:
 *   - N8nInvocationError: webhook 호출 자체 실패 (네트워크/인증/5xx)
 *   - N8nConfigError: .env 누락 또는 잘못된 URL 형식
 *
 * 사용자에게는 userMessage(한국어)를 표시하고, 개발자에게는 원본 에러를
 * console.error로 기록한다. 원본 에러 세부 정보는 Task 2-M(모니터링)에서
 * pipeline_events 테이블로 수집 예정.
 */

export type N8nErrorStep =
  | "webhook_unreachable"
  | "webhook_auth"
  | "webhook_validation"
  | "webhook_timeout"
  | "config_missing";

export class N8nInvocationError extends Error {
  public readonly step: N8nErrorStep;
  public readonly statusCode: number | null;
  public readonly userMessage: string;

  constructor(params: {
    step: N8nErrorStep;
    message: string;
    userMessage: string;
    statusCode?: number | null;
    cause?: unknown;
  }) {
    // M4 — ES2022 Error(message, { cause }) native 패턴
    // Node 16.9+ / 모든 모던 브라우저 지원. 수동 property 할당 불필요.
    super(params.message, { cause: params.cause });
    this.name = "N8nInvocationError";
    this.step = params.step;
    this.statusCode = params.statusCode ?? null;
    this.userMessage = params.userMessage;
  }
}

export class N8nConfigError extends Error {
  public readonly userMessage: string;

  constructor(message: string) {
    super(message);
    this.name = "N8nConfigError";
    this.userMessage =
      "최적화 서비스 설정이 올바르지 않습니다. 관리자에게 문의해주세요.";
  }
}
