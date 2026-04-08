import { createAdminClient } from "@/lib/supabase/admin";
import type { LogEventInput } from "./types";

/**
 * Fire-and-forget 모니터링 로깅 — Task 2-M-B-1
 *
 * 설계 원칙:
 *   1. **throw 금지** — 호출자(Server Action) 흐름에 절대 영향 주지 않는다.
 *      INSERT 실패도 console.error로만 폴백.
 *   2. **service_role 사용** — pipeline_events RLS는 SELECT만 admin에게
 *      허용. INSERT는 service_role만 가능. createAdminClient()가 service_role
 *      키를 사용한다.
 *   3. **필드 길이 절단** — message는 2000자, error_stack은 5000자로 slice.
 *      폭증한 에러 스택이 DB row를 부풀리지 않도록 한다.
 *
 * 호출 패턴:
 *   void logEvent({ service: "next-app", level: "info", message: "..." });
 *
 * 호출자가 `void`를 붙여 fire-and-forget으로 사용. await해도 되지만 일반적인
 * 케이스는 이벤트 로깅이 비즈니스 흐름보다 항상 덜 중요하므로 await 안 한다.
 */
export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    const admin = createAdminClient();

    const { error } = await admin.from("pipeline_events").insert({
      service: input.service,
      level: input.level,
      message: input.message.slice(0, 2000),
      context_type: input.contextType ?? null,
      context_id: input.contextId ?? null,
      step: input.step ?? null,
      error_stack: input.errorStack ? input.errorStack.slice(0, 5000) : null,
      user_id: input.userId ?? null,
      shop_id: input.shopId ?? null,
    });

    if (error) {
      // DB INSERT 실패 — 하지만 throw 안 함. console만 찍고 호출자에게는
      // 성공한 것처럼 반환.
      console.error("[logEvent] insert failed", {
        level: input.level,
        step: input.step,
        dbMessage: error.message,
      });
    }
  } catch (err) {
    // createAdminClient 실패(env 누락) 또는 기타 예상 못한 에러.
    // 여기서도 throw 금지. 모니터링이 비즈니스 흐름을 절대 막지 않는다.
    console.error("[logEvent] unexpected failure", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
