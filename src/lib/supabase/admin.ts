import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

/** Service Role 클라이언트 — RLS 우회. 어드민 API에서만 사용 */
export function createAdminClient(): ReturnType<typeof createSupabaseClient> {
  const env = getServerEnv();

  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
