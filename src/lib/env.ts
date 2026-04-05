import { z } from "zod/v4";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = envSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
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
