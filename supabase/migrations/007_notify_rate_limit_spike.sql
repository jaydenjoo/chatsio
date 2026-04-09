-- ============================================================
-- Chatsio — Task 2-M-B-3-B: Supabase 내부 Rate Limit 급증 알림
-- pg_cron + pg_net + Vault + Telegram — DB 내부 완결 알림 파이프라인
--
-- 이 파일은 Supabase SQL Editor를 통해 직접 적용된 변경을
-- 소스 컨트롤에 기록한다. 백업 복원 / 프로젝트 재생성 시
-- 동일한 상태로 재현 가능하도록 한다.
--
-- 목적:
--   `/api/v1/internal/log-event` 엔드포인트의 rate limiter(Task
--   2-M-B-3-A, Upstash Redis) 이후 **2차 방어선**. `pipeline_events`
--   테이블에 `step='rate_limit_exceeded'` 이벤트가 분당 50건 초과
--   쌓이면 Telegram 봇으로 한국어 알림 전송. flooding 공격 탐지 +
--   운영자 즉시 인지 목적.
--
-- 설계 결정:
--   - **DB 내부 완결**: Next.js 서버 / Vercel Cron / Edge Function 미사용.
--     외부 의존 0 → 알림의 본질("다른 시스템 고장 시 작동")에 부합
--   - **pg_cron 매 분 실행**: 1분 해상도면 flooding 대응에 충분
--   - **쿨다운 5분 5초 (cron jitter 버퍼)**: 같은 급증이 연속 감지되어도
--     5분 5초에 1회만 알림 (스팸 방지). DB 이벤트(alert_fired row) 기반이라
--     재배포에도 견고. 쿨다운 interval을 cron 주기(1분) 및 '정확히 5분'과
--     일치시키면 ms 단위 경계 탈주 시 중복 알림 위험 → Session #25/#26
--     learnings "cron jitter vs 쿨다운 경계" 참조
--   - **Vault 통합**: Telegram bot token / chat_id를 `.env`/코드가 아닌
--     Supabase Vault(암호화 저장)에서 함수 내부에서만 복호화
--   - **SECURITY DEFINER + search_path 고정**: Vault 접근 권한 확보 +
--     search_path injection 방어
--   - **EXCEPTION WHEN OTHERS**: 함수 자체가 폭발해도 cron이 계속 돌도록
--     감싸기. 알림 중단이 1차 사고보다 치명적 (🔴 fail-open 정당화, Session
--     #23 learnings 참조)
--
-- 사전 요구사항:
--   - Extensions: pg_cron, pg_net 활성화 (Database → Extensions)
--   - Vault secrets: `telegram_bot_token`, `telegram_chat_id` 등록
--     (Integrations → Vault → Secrets 탭에서 추가)
--
-- 적용 일시 (DB): 2026-04-09 (Session #25)
-- 마이그레이션 이름: 007_notify_rate_limit_spike
-- ============================================================

-- ============================================================
-- 1. Extensions (Dashboard에서도 활성화 가능)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- 2. 알림 함수 (한국어 메시지)
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_rate_limit_spike()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, net
AS $$
DECLARE
  v_count integer;
  v_threshold integer := 50;
  -- 쿨다운 5분 5초 — cron jitter(10~130ms) 여유 버퍼. '5 minutes' 정확치는
  -- 경계 ms 단위 탈주 시 중복 알림 위험. Session #25/#26 learnings 참조
  v_cooldown_interval interval := '5 minutes 5 seconds';
  v_cooldown_exists boolean;
  v_token text;
  v_chat_id text;
  v_message text;
  v_request_id bigint;
BEGIN
  -- 1. 지난 1분간 rate_limit_exceeded 이벤트 건수
  SELECT COUNT(*)::integer
  INTO v_count
  FROM public.pipeline_events
  WHERE service = 'n8n'
    AND step = 'rate_limit_exceeded'
    AND created_at > NOW() - INTERVAL '1 minute';

  -- 2. 임계 미만 → 조용히 종료
  IF v_count <= v_threshold THEN
    RETURN;
  END IF;

  -- 3. 쿨다운 체크 (5분 내 이미 알림 발송됐으면 skip)
  SELECT EXISTS (
    SELECT 1
    FROM public.pipeline_events
    WHERE service = 'next-app'
      AND step = 'alert_fired'
      AND context_type = 'rate_limit_spike'
      AND created_at > NOW() - v_cooldown_interval
  ) INTO v_cooldown_exists;

  IF v_cooldown_exists THEN
    INSERT INTO public.pipeline_events (service, level, message, step, context_type)
    VALUES (
      'next-app',
      'debug',
      format('rate_limit_spike detected (%s events/min) suppressed by cooldown', v_count),
      'alert_suppressed',
      'rate_limit_spike'
    );
    RETURN;
  END IF;

  -- 4. Vault에서 텔레그램 secret 읽기
  SELECT decrypted_secret INTO v_token
  FROM vault.decrypted_secrets
  WHERE name = 'telegram_bot_token';

  SELECT decrypted_secret INTO v_chat_id
  FROM vault.decrypted_secrets
  WHERE name = 'telegram_chat_id';

  IF v_token IS NULL OR v_chat_id IS NULL THEN
    INSERT INTO public.pipeline_events (service, level, message, step, context_type)
    VALUES (
      'next-app',
      'error',
      'telegram_bot_token or telegram_chat_id missing in vault',
      'alert_failed',
      'rate_limit_spike'
    );
    RETURN;
  END IF;

  -- 5. 한국어 알림 메시지 구성 (KST 시간 표시)
  v_message := format(
    E'⚠️ Chatsio 알림 — Rate Limit 급증 감지\n\n' ||
    E'• 감지 건수: %s건 (최근 1분)\n' ||
    E'• 설정 임계값: %s건\n' ||
    E'• 발생 시각: %s KST\n' ||
    E'• 대상 서비스: n8n → /api/v1/internal/log-event\n\n' ||
    E'👉 Supabase → pipeline_events 테이블에서\n' ||
    E'   step=''rate_limit_exceeded'' 이벤트 확인',
    v_count,
    v_threshold,
    to_char(NOW() AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS')
  );

  -- 6. Telegram API 호출 (pg_net 비동기 — fire-and-forget)
  SELECT net.http_post(
    url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
    body := jsonb_build_object(
      'chat_id', v_chat_id,
      'text', v_message
    )
  ) INTO v_request_id;

  -- 7. alert_fired 이벤트 기록 (감사 추적 + 쿨다운 기준점)
  INSERT INTO public.pipeline_events (service, level, message, step, context_type, context_id)
  VALUES (
    'next-app',
    'warn',
    format('Telegram alert fired: rate_limit_spike %s events/min', v_count),
    'alert_fired',
    'rate_limit_spike',
    v_request_id::text
  );

EXCEPTION WHEN OTHERS THEN
  -- 함수 자체 에러 시: cron이 멈추지 않도록 조용히 기록 (fail-safe)
  BEGIN
    INSERT INTO public.pipeline_events
      (service, level, message, step, context_type, error_stack)
    VALUES
      ('next-app', 'error',
       'notify_rate_limit_spike unexpected error: ' || SQLERRM,
       'alert_function_error',
       'rate_limit_spike',
       SQLSTATE);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;

COMMENT ON FUNCTION public.notify_rate_limit_spike() IS
  'Task 2-M-B-3-B/C: rate_limit_exceeded 분당 50건 초과 시 Telegram 알림 발송. pg_cron 매 분 실행. 쿨다운 5분 5초 (cron jitter 버퍼). Session #25 (2026-04-09) 구현, Session #26 쿨다운 여유 패치.';

-- ============================================================
-- 3. Cron Job 등록 (멱등 — 이미 있으면 제거 후 재등록)
-- ============================================================

DO $mig$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'rate-limit-spike-alert';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
END
$mig$;

SELECT cron.schedule(
  'rate-limit-spike-alert',
  '* * * * *',
  $sched$ SELECT public.notify_rate_limit_spike(); $sched$
);

-- ============================================================
-- 4. 검증 쿼리 (수동 실행)
-- ============================================================

-- 함수 등록 확인:
-- SELECT proname, prosecdef FROM pg_proc WHERE proname = 'notify_rate_limit_spike';

-- Cron job 확인:
-- SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'rate-limit-spike-alert';

-- 최근 실행 상태:
-- SELECT runid, status, return_message, start_time
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'rate-limit-spike-alert')
-- ORDER BY start_time DESC LIMIT 5;

-- 알림 발송 이력:
-- SELECT created_at, step, message FROM pipeline_events
-- WHERE context_type = 'rate_limit_spike'
-- ORDER BY created_at DESC LIMIT 10;

-- pg_net HTTP 응답:
-- SELECT id, status_code, LEFT(content::text, 200), created
-- FROM net._http_response ORDER BY created DESC LIMIT 5;

-- ============================================================
-- Rollback (필요 시)
-- ============================================================

-- DO $rb$
-- DECLARE v_jobid bigint;
-- BEGIN
--   SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'rate-limit-spike-alert';
--   IF v_jobid IS NOT NULL THEN
--     PERFORM cron.unschedule(v_jobid);
--   END IF;
-- END $rb$;
-- DROP FUNCTION IF EXISTS public.notify_rate_limit_spike();
-- -- Extensions(pg_cron, pg_net)는 다른 기능이 의존 가능하므로 DROP 금지
