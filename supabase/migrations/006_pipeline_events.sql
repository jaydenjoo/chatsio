-- ============================================================
-- Chatsio — Task 2-M-B-1: 통합 모니터링 인프라 1단계
-- pipeline_events 테이블 + 인덱스 4개 + RLS
--
-- 이 파일은 Supabase MCP `apply_migration`을 통해 DB에 적용된
-- 마이그레이션을 소스 컨트롤에 기록한다. 백업 복원 / 프로젝트 재생성 시
-- 동일한 상태로 재현 가능하도록 한다.
--
-- 목적:
--   Next.js Server Action / n8n 워크플로우에서 발생하는 이벤트(성공/
--   경고/에러)를 단일 테이블에 수집. 운영 중 장애 원인 추적과 퍼널
--   가시화를 한 곳에서 수행한다.
--
-- 설계 결정:
--   - service: 'next-app' | 'n8n' (라벨 2개로 시작, 확장 가능)
--   - level: debug/info/warn/error CHECK 제약
--   - context_type/context_id: 느슨한 문자열 → 다양한 엔티티(optimization,
--     product, auth, onboarding) 참조에 대응. FK 제약 없음 — 이벤트는
--     원본 row가 사라져도 보존되어야 하기 때문
--   - user_id/shop_id: FK ON DELETE SET NULL — 사용자/쇼핑몰이 삭제되어도
--     이벤트 히스토리는 살려둠. cascade 금지
--   - error_stack: error level일 때만 채움. text (길이 제한은 애플리케이션
--     레이어에서 slice로 처리)
--
-- RLS 전략:
--   - SELECT: user_profiles.role = 'admin'인 사용자만. admin 아닌 유저는
--     이벤트 목록 접근 0
--   - INSERT: 정책을 만들지 않음 → authenticated 기본 deny.
--     service_role(RLS 우회) 클라이언트만 INSERT 가능. 이는 코드에서
--     `src/lib/supabase/admin.ts` createAdminClient()를 통해 이루어진다
--   - UPDATE/DELETE: 정책 없음 → 변경 불가(감사 로그 무결성)
--
-- 적용 일시 (DB): 2026-04-08
-- 마이그레이션 이름: 006_pipeline_events
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pipeline_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  service      text NOT NULL,
  level        text NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  context_type text,
  context_id   text,
  step         text,
  message      text NOT NULL,
  error_stack  text,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  shop_id      uuid REFERENCES public.shops(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.pipeline_events IS
  'Chatsio 통합 모니터링 로그. Next.js Server Action + n8n이 단일 싱크로 INSERT. admin만 SELECT.';

-- ============================================
-- 인덱스
-- ============================================

-- 최근 이벤트 조회 (events 페이지 기본 정렬)
CREATE INDEX IF NOT EXISTS pipeline_events_created_idx
  ON public.pipeline_events (created_at DESC);

-- level 필터 + 시간 정렬 (error만 보기, warn만 보기 등)
CREATE INDEX IF NOT EXISTS pipeline_events_level_created_idx
  ON public.pipeline_events (level, created_at DESC);

-- 특정 엔티티의 전체 히스토리 추적 (optimization id → 모든 이벤트)
CREATE INDEX IF NOT EXISTS pipeline_events_context_idx
  ON public.pipeline_events (context_type, context_id);

-- 특정 사용자의 이벤트 추적 (사용자 문의 대응)
CREATE INDEX IF NOT EXISTS pipeline_events_user_created_idx
  ON public.pipeline_events (user_id, created_at DESC);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.pipeline_events ENABLE ROW LEVEL SECURITY;

-- SELECT: public.is_admin() 헬퍼 사용 (migration 001에서 정의).
-- is_admin()은 SECURITY DEFINER로 user_profiles의 RLS를 우회하므로
-- 나중에 user_profiles RLS를 강화해도 이 정책이 부서지지 않음.
-- 프로젝트 전체 admin 정책 패턴(prompts, prompt_versions 등)과 일관.
CREATE POLICY pipeline_events_admin_select
  ON public.pipeline_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- INSERT/UPDATE/DELETE 정책은 만들지 않음
-- → authenticated는 기본 deny, service_role만 RLS 우회로 INSERT 가능

-- ============================================
-- ROLLBACK (수동 실행용)
-- ============================================
-- DROP TABLE IF EXISTS public.pipeline_events;
-- (인덱스/정책/COMMENT는 CASCADE로 자동 삭제)
