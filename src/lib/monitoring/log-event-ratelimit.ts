import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getUpstashEnv } from "@/lib/env";

/**
 * log-event API rate limiter — Task 2-M-B-3-A
 *
 * Bearer 토큰 단위로 분당 호출 횟수를 제한한다. 🔴 프로젝트의 감사 로그
 * 보호가 목적: 토큰이 유출되어 공격자가 대량의 가짜 이벤트로 `pipeline_events`
 * 테이블을 오염시키는(flooding) 것을 구조적으로 차단한다.
 *
 * ## 설계 결정
 *
 * 1. **Key = 토큰의 SHA-256 해시** — Redis에 토큰 원본을 **절대** 저장하지
 *    않는다. 해시만 저장하면 Upstash 대시보드/로그에서 값이 노출되어도
 *    역산 불가능. 🔴 프로젝트 원칙 "secret은 가는 모든 경로에서 익명화".
 *
 * 2. **슬라이딩 윈도우 100건 / 1분** — runbook의 Supabase alert 임계값
 *    (분당 100건)과 일치. fixed window가 아닌 sliding을 선택한 이유는
 *    "59초에 100건 + 61초에 100건" 같은 경계 burst를 막기 위함.
 *
 * 3. **env 부재 → no-op fallback** — `UPSTASH_REDIS_REST_URL`/`TOKEN`이
 *    없으면 항상 `success: true`를 반환하는 더미 limiter를 리턴한다.
 *    로컬 dev/CI/테스트 환경에서 Upstash 계정 없이도 API가 동작해야 하기
 *    때문. 프로덕션에서는 반드시 Vercel Env에 두 값을 등록해야 한다.
 *
 * 4. **Redis 장애 → fail-open** — `ratelimit.limit()`이 throw하면
 *    호출자(`checkRateLimit`)가 `success: true`를 리턴해서 통과시킨다.
 *    근거: 감사 로그가 **들어오지 않는 것**이 rate limit이 **잠시 bypass
 *    되는 것**보다 훨씬 위험하다. Redis 장애 자체는 Upstash의 가용성에
 *    의존하는 외부 의존성이고, fail-closed로 갔다가 "로그가 안 들어와서
 *    장애를 놓치는" 2차 사고가 더 치명적.
 *
 * 5. **싱글턴 인스턴스** — Next.js serverless 환경에서 cold start마다
 *    새 Redis 클라이언트를 만들면 지연/커넥션 낭비. 모듈 레벨 캐싱으로
 *    lambda instance 수명 동안 재사용.
 *
 * 6. **ephemeralCache + timeout** — Upstash SDK 옵션. 같은 lambda
 *    instance 내에서 짧게 캐싱하여 중복 Redis 호출을 줄이고, Redis가
 *    느려도 1초 안에 fail-open으로 빠져나온다.
 *
 * 7. **analytics: false** — Upstash가 자동 수집하는 분석 명령어가
 *    commands/month 카운터를 두 배로 늘리는 것을 막는다. 상세 관측은
 *    Supabase `pipeline_events`에 이미 기록되므로 중복 수집 불필요.
 */

/** 분당 호출 상한 — runbook의 Supabase alert 임계값과 일치 */
const WINDOW = "1 m" as const;
const LIMIT = 100;

/** 결과 타입 — `ratelimit.limit()`의 응답과 호환되는 최소 shape */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** epoch ms — 다음 reset 시점 */
  reset: number;
}

/**
 * no-op limiter — env가 없을 때 사용.
 * 항상 통과시키고 `limit: 0`을 힌트로 남겨서 "active가 아니다"를 구분 가능.
 */
const NOOP_RESULT: RateLimitResult = {
  success: true,
  limit: 0,
  remaining: 0,
  reset: 0,
};

/**
 * 싱글턴 Ratelimit 인스턴스 — 한 번 초기화되면 재사용.
 *
 * - `null`: 아직 초기화 시도 안 됨
 * - `false`: env 부재 확인 완료 → no-op 모드
 * - `Ratelimit`: 활성 인스턴스
 */
let cachedRatelimit: Ratelimit | false | null = null;

function getRatelimit(): Ratelimit | false {
  if (cachedRatelimit !== null) {
    return cachedRatelimit;
  }

  const env = getUpstashEnv();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    // security-reviewer MEDIUM: 프로덕션에서 Vercel Env 누락 시 rate limiting이
    // 조용히 비활성화되는 블라인드 스팟을 방지. 싱글턴이라 lambda instance당
    // 단 1회 출력 → Vercel Logs에서 이 prefix만 grep하면 "어느 배포에서
    // no-op이 켜졌는지" 즉시 탐지 가능. 로컬 dev에서는 의도된 상태.
    console.warn(
      "[log-event ratelimit] UPSTASH_REDIS_REST_URL/TOKEN 부재 → rate limiting 비활성화 (no-op 모드). 로컬 dev만 정상 — 프로덕션이라면 Vercel Env 등록 누락.",
    );
    cachedRatelimit = false;
    return false;
  }

  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  cachedRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(LIMIT, WINDOW),
    analytics: false,
    prefix: "chatsio:log-event",
    ephemeralCache: new Map(),
    timeout: 1000,
  });

  return cachedRatelimit;
}

/**
 * Bearer 토큰을 Redis key로 정규화한다.
 *
 * SHA-256 해시 전체(64자 hex = 256bit)를 사용한다. truncation 없음 —
 * Redis key 길이 차이(16자 vs 64자)는 Upstash 요금/성능에 무시할 수준이며,
 * "왜 잘랐지?"라는 의문의 여지를 없앤다. 🔴 원칙: 원본 토큰 문자열은
 * **어떤 경로로도** Redis에 들어가면 안 됨 — 단방향 해시만 저장.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Rate limit 체크 — log-event API route에서 호출.
 *
 * @param token 인증 통과한 Bearer 토큰 (PRIMARY 또는 SECONDARY)
 * @returns `success: false`면 429로 응답, `true`면 통과
 *
 * 실패 시나리오:
 *   1. env 부재 → no-op 통과 (로컬 dev)
 *   2. Redis 장애 → fail-open 통과 + console.error 기록
 *   3. 정상 동작 + 한도 초과 → `success: false`
 */
export async function checkLogEventRateLimit(
  token: string,
): Promise<RateLimitResult> {
  const limiter = getRatelimit();
  if (limiter === false) {
    return NOOP_RESULT;
  }

  try {
    const result = await limiter.limit(hashToken(token));
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (err) {
    // Redis 장애 — fail-open (감사 로그 우선)
    console.error(
      "[log-event ratelimit] Redis 호출 실패, fail-open으로 통과",
      err instanceof Error ? err.message : String(err),
    );
    return { ...NOOP_RESULT, success: true };
  }
}

/**
 * 테스트 전용 — 싱글턴 캐시를 리셋. 프로덕션 코드에서는 호출 금지.
 * 테스트 격리를 위해 필요한 경우에만 import.
 */
export function __resetRatelimitCacheForTesting(): void {
  cachedRatelimit = null;
}
