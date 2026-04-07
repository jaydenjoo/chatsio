/**
 * n8n V8 Webhook 호출 클라이언트.
 *
 * 비동기 패턴 (Task 2-3 Plan v3):
 *   1. Next.js Server Action이 optimizations row를 status='queued'로 먼저 INSERT
 *   2. 이 함수로 n8n webhook 호출
 *   3. n8n Webhook 노드는 "Respond: Immediately" 모드라서 즉시 200 반환
 *   4. n8n 워크플로우는 백그라운드에서 32s~155s 걸려 DB row를 UPDATE
 *   5. Next.js 상태 페이지는 Supabase Realtime으로 row 변화를 구독
 *
 * 이 함수는 **동기**로 await하지만 webhook이 즉시 응답하므로 Server Action
 * 전체 지연은 1~3초 이내. 네트워크/인증 실패는 즉시 감지 가능.
 *
 * fire-and-forget이 아닌 이유:
 *   Vercel serverless는 response 반환 후 함수 프로세스를 종료한다. fetch가
 *   중간에 끊길 위험이 있다. n8n의 Immediately 모드 + 동기 await이 가장 안전.
 */

import { getN8nEnv } from "@/lib/env";
import { N8nConfigError, N8nInvocationError } from "./errors";
import type { N8nOptimizationPayload } from "./payload";

const WEBHOOK_TIMEOUT_MS = 10_000; // 10초 — webhook ACK 대기 한도

export interface InvokeN8nResult {
  readonly ok: true;
}

export async function invokeN8nWebhook(
  payload: N8nOptimizationPayload,
): Promise<InvokeN8nResult> {
  let env: ReturnType<typeof getN8nEnv>;
  try {
    env = getN8nEnv();
  } catch (err) {
    throw new N8nConfigError(
      err instanceof Error ? err.message : "n8n 환경변수 설정 오류",
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(env.N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.N8N_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      // Next.js fetch cache 완전 비활성화 — 최적화 요청은 항상 fresh
      cache: "no-store",
    });
  } catch (err) {
    clearTimeout(timeoutId);
    // AbortError = timeout, TypeError = network unreachable
    if (err instanceof Error && err.name === "AbortError") {
      throw new N8nInvocationError({
        step: "webhook_timeout",
        message: `n8n webhook 타임아웃 (${WEBHOOK_TIMEOUT_MS}ms)`,
        userMessage:
          "최적화 서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.",
        cause: err,
      });
    }
    throw new N8nInvocationError({
      step: "webhook_unreachable",
      message: `n8n webhook 연결 실패: ${err instanceof Error ? err.message : String(err)}`,
      userMessage:
        "최적화 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
      cause: err,
    });
  }

  clearTimeout(timeoutId);

  if (response.status === 401 || response.status === 403) {
    throw new N8nInvocationError({
      step: "webhook_auth",
      statusCode: response.status,
      message: `n8n webhook 인증 실패 (${response.status})`,
      userMessage:
        "최적화 서비스 인증에 실패했습니다. 관리자에게 문의해주세요.",
    });
  }

  if (response.status >= 400 && response.status < 500) {
    throw new N8nInvocationError({
      step: "webhook_validation",
      statusCode: response.status,
      message: `n8n webhook 검증 실패 (${response.status})`,
      userMessage:
        "최적화 요청이 거부되었습니다. 입력값을 확인해주세요.",
    });
  }

  if (!response.ok) {
    throw new N8nInvocationError({
      step: "webhook_unreachable",
      statusCode: response.status,
      message: `n8n webhook 서버 오류 (${response.status})`,
      userMessage:
        "최적화 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  }

  return { ok: true };
}
