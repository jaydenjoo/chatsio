import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

/**
 * Service Role 클라이언트 — RLS 우회. 어드민/모니터링에서만 사용.
 *
 * 반환 타입을 `SupabaseClient`로 명시 — `ReturnType<typeof createSupabaseClient>`
 * 는 generic 없이 호출될 경우 `.from(...).insert(...)` 호출이 `never`로
 * 추론되는 문제가 있음. Drizzle을 primary schema 소스로 쓰고 Supabase
 * Database 타입 생성은 하지 않는 이 프로젝트 정책을 유지하려면
 * `SupabaseClient`(기본 generic 활용)로 두는 것이 가장 깔끔하다.
 *
 * TODO: types/database.ts를 `supabase gen types`로 생성하게 되면
 *       `SupabaseClient<Database>`로 강타입화 — 그 시점까지는 SDK 기본값.
 */
export function createAdminClient(): SupabaseClient {
  const env = getServerEnv();

  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
