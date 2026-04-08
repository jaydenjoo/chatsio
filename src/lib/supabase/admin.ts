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
 *
 * 싱글톤 패턴 (Task 2-M-B-2, B-1 Should Fix #1 이연분 해소):
 *   - 모듈 레벨 변수에 첫 인스턴스를 캐싱하여 재사용.
 *   - `logEvent`가 runOptimization 한 번에 8회 호출되는 등의 패턴에서
 *     매번 새 `SupabaseClient` 생성 오버헤드를 제거.
 *   - Node.js 서버 프로세스 내 공유. 서버리스 함수의 각 인스턴스는
 *     자체 프로세스 → 인스턴스 간 공유 없음 → 메모리 누수 위험 없음.
 *   - env 누락 시 `getServerEnv()`가 첫 호출 시점에 throw → 이후 호출은
 *     이미 캐싱된 클라이언트를 반환하므로 env 재검증 없이 빠르다.
 */
let cachedAdminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (cachedAdminClient !== null) {
    return cachedAdminClient;
  }

  const env = getServerEnv();

  cachedAdminClient = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return cachedAdminClient;
}
