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
