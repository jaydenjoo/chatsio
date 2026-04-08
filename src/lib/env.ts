import { z } from "zod/v4";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = envSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

// n8n webhook 전용 — runOptimization Server Action에서만 필요
// optimizations 페이지 밖에서 getPublicEnv/getServerEnv 호출이 실패하지
// 않도록 분리된 스키마를 사용한다.
const n8nEnvSchema = z.object({
  N8N_WEBHOOK_URL: z.url(),
  N8N_WEBHOOK_SECRET: z.string().min(8),
});

// Internal log-event API 전용 — `POST /api/v1/internal/log-event` 엔드포인트에서만
// 필요. 다른 런타임 경로는 이 값을 호출하지 않으므로 분리된 스키마를 사용.
//
// Zero-downtime rotation 지원 (Task 4):
//   - PRIMARY: 현재 활성 시크릿. 필수. 최소 32자.
//   - SECONDARY: rotation 기간 동안만 설정. 옵션. 최소 32자.
//
// 요청 토큰은 PRIMARY와 SECONDARY 양쪽과 비교되며 **둘 중 하나라도 일치**하면
// 통과. 이는 "새 시크릿 배포 → 호출자 전환 → 구 시크릿 제거" 3단계를
// 무중단으로 실행하기 위한 설계. route.ts의 `checkToken` 함수가 타이밍
// 일관성까지 보장한다.
const internalLogEventEnvSchema = z.object({
  INTERNAL_LOG_EVENT_SECRET_PRIMARY: z.string().min(32),
  INTERNAL_LOG_EVENT_SECRET_SECONDARY: z.string().min(32).optional(),
});

/** 클라이언트 + 서버 공용 환경변수 */
export function getPublicEnv(): z.infer<typeof envSchema> {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      `환경변수 누락: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}. .env.local 파일을 확인하세요.`
    );
  }

  return parsed.data;
}

/** 서버 전용 환경변수 (API Route, Server Action) */
export function getServerEnv(): z.infer<typeof serverEnvSchema> {
  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      `서버 환경변수 누락: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}. .env.local 파일을 확인하세요.`
    );
  }

  return parsed.data;
}

/**
 * n8n webhook 환경변수 — 최적화 실행 Server Action에서만 호출.
 * 다른 페이지 로드에는 영향을 주지 않도록 별도 함수로 분리.
 */
export function getN8nEnv(): z.infer<typeof n8nEnvSchema> {
  const parsed = n8nEnvSchema.safeParse({
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
  });

  if (!parsed.success) {
    throw new Error(
      `n8n 환경변수 누락: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}. .env.local 파일을 확인하세요.`
    );
  }

  return parsed.data;
}

/**
 * Internal log-event API 환경변수 — `POST /api/v1/internal/log-event`에서만 호출.
 * 다른 경로(페이지 렌더, Server Action)가 이 값 부재로 영향받지 않도록 분리.
 *
 * 생성 방법: `openssl rand -hex 32` (64자 hex)
 *
 * Rotation 사용법 (zero-downtime):
 *   1. 신규 PRIMARY 생성 → 현재 PRIMARY를 SECONDARY로 복사 → 신규 값을 PRIMARY로 설정
 *   2. n8n credential을 신규 PRIMARY 값으로 교체 (기존 SECONDARY는 rotation 기간 동안 fallback)
 *   3. Vercel 재배포 완료 후 SECONDARY 환경변수 제거 → rotation 완료
 *
 * Runbook: docs/runbooks/log-event-api.md
 */
export function getInternalLogEventEnv(): z.infer<typeof internalLogEventEnvSchema> {
  const parsed = internalLogEventEnvSchema.safeParse({
    INTERNAL_LOG_EVENT_SECRET_PRIMARY: process.env.INTERNAL_LOG_EVENT_SECRET_PRIMARY,
    INTERNAL_LOG_EVENT_SECRET_SECONDARY: process.env.INTERNAL_LOG_EVENT_SECRET_SECONDARY,
  });

  if (!parsed.success) {
    throw new Error(
      `INTERNAL_LOG_EVENT_SECRET_PRIMARY 환경변수 누락 또는 32자 미만 (SECONDARY는 옵션): ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}. .env.local 파일을 확인하세요.`
    );
  }

  return parsed.data;
}
