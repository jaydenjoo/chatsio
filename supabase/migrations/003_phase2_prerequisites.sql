-- ============================================================
-- Chatsio — Phase 2 Prerequisites
-- Pre-Task 2A: AI 구조화 파이프라인 진입 전 사전 정리
--
-- 이 파일은 Supabase MCP `apply_migration`을 통해 DB에 적용된
-- 마이그레이션을 소스 컨트롤에 기록한다. 백업 복원 / 프로젝트 재생성 시
-- 동일한 상태로 재현 가능하도록 한다.
--
-- 적용 일시 (DB): 2026-04-06
-- 마이그레이션 이름:
--   - optimizations_idempotency_key_unique
--   - llms_txt_versions_table
--
-- 변경 요약:
--   1. optimizations.idempotency_key 에 UNIQUE 제약 추가
--      → CEO Review 멱등성 요구를 코드 레벨이 아닌 DB 레벨에서 강제
--      → race condition으로 같은 키 두 row 진입 차단
--   2. llms_txt_versions 신규 테이블 + RLS
--      → PRD 부록 C 의 llms.txt 버전 관리. immutable 이력
--      → UPDATE/DELETE 정책 없음 (의도적)
--
-- 흡수 결정 (별도 테이블 미생성):
--   - optimization_history → optimizations 테이블이 이미 흡수
--     (idempotency_key, result_json, jsonld, score, error_message,
--      duration_ms, retry_count, plan, status 모두 보유)
--   - extraction_logs → optimizations.result_json (jsonb) 안에 흡수
--     Phase 4 어드민 분석 화면 필요 시 별도 테이블로 분리
--   - cost_tracking → Phase 4 (어드민 비용 모니터링)로 이연
-- ============================================================

-- ============================================
-- 1. optimizations.idempotency_key UNIQUE
-- ============================================
ALTER TABLE public.optimizations
  ADD CONSTRAINT optimizations_idempotency_key_unique
  UNIQUE (idempotency_key);

-- ============================================
-- 2. llms_txt_versions
-- ============================================
CREATE TABLE IF NOT EXISTS public.llms_txt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  version int NOT NULL,
  content text NOT NULL,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, version)
);

ALTER TABLE public.llms_txt_versions ENABLE ROW LEVEL SECURITY;

-- 본인 쇼핑몰의 버전만 SELECT
CREATE POLICY "shop_owners_select_llms_txt"
  ON public.llms_txt_versions FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM public.shops WHERE user_id = (SELECT auth.uid())
    )
  );

-- 본인 쇼핑몰에만 INSERT
CREATE POLICY "shop_owners_insert_llms_txt"
  ON public.llms_txt_versions FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT id FROM public.shops WHERE user_id = (SELECT auth.uid())
    )
  );

-- UPDATE/DELETE 정책 없음 — 이력은 immutable (의도)

CREATE INDEX IF NOT EXISTS idx_llms_txt_versions_shop_id
  ON public.llms_txt_versions (shop_id, version DESC);

-- ============================================
-- ROLLBACK (수동 실행용)
-- ============================================
-- DROP TABLE IF EXISTS public.llms_txt_versions;
-- ALTER TABLE public.optimizations
--   DROP CONSTRAINT IF EXISTS optimizations_idempotency_key_unique;
