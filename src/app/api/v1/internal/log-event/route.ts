import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { z } from "zod/v4";
import { apiError, apiSuccess, ApiErrors, validateBody } from "@/lib/api";
import { getInternalLogEventEnv } from "@/lib/env";
import { logEvent } from "@/lib/monitoring/log-event";

/**
 * POST /api/v1/internal/log-event — Task 2-M-B-2 + Task 4 (Zero-downtime rotation)
 *
 * 외부 서비스(n8n Error Handler 등)에서 Chatsio `pipeline_events` 테이블에
 * 이벤트를 기록할 수 있는 내부 전용 엔드포인트. Bearer 토큰 인증 + Zod 검증
 * 통과 시 `logEvent()` fire-and-forget 호출.
 *
 * ## 보안 설계 (🔴 프로젝트 — security-reviewer 필수)
 *
 * 1. **Bearer 토큰 상수 시간 비교 + Zero-downtime rotation**
 *    - `crypto.timingSafeEqual`을 사용해 타이밍 공격 방어.
 *    - 제공 토큰과 기대 토큰을 각각 SHA-256으로 해시 → 길이 고정 32 바이트
 *      → `timingSafeEqual`로 비교.
 *    - **PRIMARY + SECONDARY 이중 비교**: env에 SECONDARY가 있으면 PRIMARY와
 *      SECONDARY **두 토큰 모두**와 상수 시간 비교한 뒤 OR 결합. rotation
 *      기간 동안 구/신 토큰이 동시에 유효 → 호출자 전환 시 무중단.
 *    - **SECONDARY 부재 시에도 타이밍 일관성**: SECONDARY가 없으면 PRIMARY로
 *      dummy 비교를 한 번 더 실행하여 "rotation 진행 중인지" 여부가 응답
 *      시간으로 leak되지 않도록 한다 (`checkToken` 함수 주석 참조).
 *
 * 2. **env fail-loud**
 *    - `getInternalLogEventEnv()`는 `INTERNAL_LOG_EVENT_SECRET_PRIMARY`가
 *      없거나 32자 미만이면 throw. 여기서는 try-catch로 잡아 500으로 응답하고
 *      server log에만 원인 기록 → 응답에는 내부 사유 노출 금지.
 *    - "secret 없으니 통과"는 절대 금지 (fail-open 금지).
 *
 * 3. **Zod 검증 + 에러 상세 비공개**
 *    - 필드 타입/길이/열거형을 스키마로 사전 제약 → 잘못된 페이로드는 400.
 *    - 실패 사유(Zod issues)는 console에만 기록하고 응답에는 generic 메시지
 *      "invalid payload"만 노출 (정보 누출 방지).
 *
 * 4. **CSRF 무관**
 *    - Bearer 토큰은 브라우저가 cross-origin 요청에 자동으로 첨부하지 않는다.
 *      쿠키 기반 세션이 아니라서 CSRF 공격 벡터가 존재하지 않는다.
 *
 * 5. **Rate limiting 제외 (MVP)**
 *    - Bearer 토큰 보유자만 호출 가능하고, 현재 호출자는 내부 n8n 워크플로우
 *      단일 루트뿐. 토큰 유출 시에는 rate limit보다 토큰 rotation이 우선이며
 *      이제 zero-downtime으로 가능.
 *    - V2: Upstash Redis 기반 per-IP rate limit 도입 검토 (별도 Task).
 *
 * 6. **Fire-and-forget logEvent**
 *    - `logEvent`는 throw하지 않는 fail-safe 래퍼. DB insert 실패도 console
 *      로만 기록하고 API는 여전히 200 리턴한다. 이 설계는 의도적이다:
 *      "로그가 하나 빠지는 것"이 "n8n이 retry 루프로 진입하는 것"보다 안전.
 *      insert 장애는 Supabase dashboard + server log로 관측한다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Body 스키마 — `LogEventInput`과 1:1 대응.
 *
 * 길이 제약은 `logEvent` 내부 truncation과 별개로 API 경계에서 먼저 차단하여
 * 토큰 탈취 공격자가 DB row를 극단적으로 부풀리는 것을 방지한다.
 */
const LogEventBodySchema = z.object({
  service: z.enum(["next-app", "n8n"]),
  level: z.enum(["debug", "info", "warn", "error"]),
  message: z.string().min(1).max(2000),
  contextType: z.string().min(1).max(100).optional(),
  contextId: z.string().min(1).max(200).optional(),
  step: z.string().min(1).max(100).optional(),
  errorStack: z.string().min(1).max(5000).optional(),
  userId: z.string().uuid().optional(),
  shopId: z.string().uuid().optional(),
});

/**
 * Bearer 토큰 상수 시간 비교.
 *
 * 두 문자열을 SHA-256으로 해시하여 항상 32 바이트로 만든 뒤 `timingSafeEqual`
 * 로 비교한다. 해시 단계에서 입력 길이가 사라지므로:
 *   - 길이 기반 타이밍 누출 차단
 *   - `timingSafeEqual`이 요구하는 "길이 동일" 조건 자동 충족
 *   - 원본 토큰 메모리 비교 전에 고정 시간으로 정규화
 *
 * 이 패턴은 Node.js 공식 crypto 문서에서 권장하는 timing-safe 비교 관용구.
 */
function constantTimeEquals(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a, "utf8").digest();
  const hashB = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(hashA, hashB);
}

/**
 * Zero-downtime rotation 토큰 검증.
 *
 * PRIMARY와 SECONDARY **둘 다 항상 비교**한 뒤 OR 결합한다. 타이밍 일관성
 * 규칙:
 *   1. SECONDARY가 설정되어 있으면 그 값과 비교
 *   2. SECONDARY가 없으면 PRIMARY로 **dummy 비교** — 두 번의 SHA-256 해시와
 *      `timingSafeEqual` 호출이 항상 실행되도록 함
 *
 * 왜 dummy가 필요한가: "SECONDARY 존재 여부"조차 응답 시간으로 leak되면
 * 공격자가 "이 시스템이 rotation 중인지"를 알 수 있다. 실질적 위협은 낮지만
 * 🔴 프로젝트의 방어 일관성 원칙상 타이밍 경로를 하나로 유지한다.
 *
 * 왜 JavaScript `||`의 short-circuit이 문제인가: `a || b`에서 a가 true면
 * b를 평가하지 않으므로 타이밍 차이 발생. 이 함수는 두 비교를 **별도
 * const**에 할당한 뒤 마지막에 `||`로 결합하여 항상 두 번 실행됨을 보장.
 */
function checkToken(
  providedToken: string,
  primary: string,
  secondary: string | undefined,
): boolean {
  // SECONDARY가 없으면 PRIMARY로 dummy target — 두 번째 비교를 항상 실행.
  const secondaryTarget = secondary ?? primary;

  // 두 비교를 모두 먼저 실행 — `||` short-circuit을 회피하기 위해 const로 고정.
  const primaryMatch = constantTimeEquals(providedToken, primary);
  const secondaryMatch = constantTimeEquals(providedToken, secondaryTarget);

  return primaryMatch || secondaryMatch;
}

export async function POST(request: NextRequest): Promise<Response> {
  // 1) env 검증 — 누락 시 fail-loud 500. 응답 본문에는 사유 leak 금지.
  let primary: string;
  let secondary: string | undefined;
  try {
    const env = getInternalLogEventEnv();
    primary = env.INTERNAL_LOG_EVENT_SECRET_PRIMARY;
    secondary = env.INTERNAL_LOG_EVENT_SECRET_SECONDARY;
  } catch (envErr) {
    console.error(
      "[log-event API] INTERNAL_LOG_EVENT_SECRET_PRIMARY 환경변수 문제",
      envErr instanceof Error ? envErr.message : String(envErr),
    );
    return ApiErrors.internal();
  }

  // 2) Authorization 헤더 파싱 + PRIMARY/SECONDARY 이중 상수 시간 비교
  //
  // security-reviewer Should Fix(HIGH) 반영 — 빈 토큰 early return은 과거
  // 버전에서 타이밍 오라클이었다. 지금은 빈 문자열도 `checkToken`을 거친다.
  // `checkToken` 내부는 PRIMARY와 SECONDARY 둘 다 항상 비교하여 rotation
  // 활성화 여부조차 leak되지 않도록 설계되어 있다.
  const authHeader = request.headers.get("authorization") ?? "";
  const providedToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!checkToken(providedToken, primary, secondary)) {
    return ApiErrors.unauthorized();
  }

  // 3) Body 파싱 + Zod 검증 — 공용 `validateBody` 헬퍼 재사용.
  //
  // 이 엔드포인트는 보안 민감 (🔴 등급) 이므로 `validated.response`(상세
  // issue가 포함된 422)를 그대로 사용하지 않고, generic 400 응답으로
  // 대체한다. Zod issues는 console에만 기록하여 정보 leak을 차단하면서도
  // "JSON parse + safeParse" 로직 중복은 헬퍼로 제거.
  const validated = await validateBody(request, LogEventBodySchema);
  if (!validated.success) {
    if (validated.kind === "json_parse") {
      console.error("[log-event API] JSON 파싱 실패");
    } else {
      console.error(
        "[log-event API] Zod 검증 실패",
        validated.issues?.map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
        })),
      );
    }
    return apiError("INVALID_PAYLOAD", "invalid payload", 400);
  }

  // 4) logEvent 호출 — fire-and-forget. insert 실패도 200으로 응답.
  //
  // `validated.data`는 `LogEventBodySchema`가 구조적으로 `LogEventInput`과
  // 동일하므로 직접 전달. 수동 필드 매핑은 새 필드 추가 시 silent drop
  // 위험이 있어 제거 (code-reviewer Should Fix #1 반영).
  void logEvent(validated.data);

  return apiSuccess({ logged: true });
}
