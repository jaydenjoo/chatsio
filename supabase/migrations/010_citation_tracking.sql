-- ============================================================
-- Chatsio — Migration 010: AI 인용 추적 PoC (Phase 5)
--
-- 목적:
--   상품별로 Claude가 생성한 구매 의도 질문 세트를 저장하고,
--   ChatGPT에 질의한 결과(인용 여부, 매칭 유형, 점수)를 기록한다.
--   PoC 단계이므로 수동 트리거만 지원, 스케줄 실행은 Phase 6.
--
-- 테이블 2개:
--   citation_questions  — 상품당 1개 질문 세트 (UNIQUE product_id)
--   citation_tracking   — 질문당 1행, run_id로 실행 그룹핑 (immutable)
--
-- RLS 전략:
--   SELECT: 소유자(shop_id 기준) + admin
--   INSERT/UPDATE: service_role만 (createAdminClient)
--   citation_tracking은 UPDATE/DELETE 없음 (감사 로그 성격)
--
-- 적용: Supabase SQL Editor에서 수동 실행
-- 마이그레이션 이름: 010_citation_tracking
-- ============================================================

-- ============================================
-- 1. citation_questions — 상품별 질문 세트
-- ============================================

CREATE TABLE IF NOT EXISTS public.citation_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shop_id       uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  questions     jsonb NOT NULL,
  generated_by  text NOT NULL DEFAULT 'claude-3-5-haiku-20241022',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.citation_questions IS
  'Phase 5 PoC: 상품별 AI 생성 구매 의도 질문 세트. Claude가 생성, 상품당 1세트.';

-- 상품당 1개 질문 세트만 허용
CREATE UNIQUE INDEX IF NOT EXISTS citation_questions_product_unique
  ON public.citation_questions (product_id);

-- updated_at 자동 갱신 (migration 008에서 생성된 함수 재사용)
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.citation_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 2. citation_tracking — 질의 결과 (질문당 1행)
-- ============================================

CREATE TABLE IF NOT EXISTS public.citation_tracking (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shop_id         uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  run_id          uuid NOT NULL,
  question_text   text NOT NULL,
  ai_response     text NOT NULL,
  is_cited        boolean NOT NULL DEFAULT false,
  matched_name    boolean NOT NULL DEFAULT false,
  matched_url     boolean NOT NULL DEFAULT false,
  citation_score  integer NOT NULL DEFAULT 0,
  model           text NOT NULL DEFAULT 'gpt-4o-mini',
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.citation_tracking IS
  'Phase 5 PoC: ChatGPT 질의 결과. 질문 1개 = 1행. run_id로 실행 그룹핑. immutable (UPDATE 없음).';

-- 상품별 최신 결과 조회 (admin 페이지)
CREATE INDEX IF NOT EXISTS citation_tracking_product_created_idx
  ON public.citation_tracking (product_id, created_at DESC);

-- 실행 그룹 조회
CREATE INDEX IF NOT EXISTS citation_tracking_run_idx
  ON public.citation_tracking (run_id);

-- 쇼핑몰별 결과 조회 (RLS + admin 목록)
CREATE INDEX IF NOT EXISTS citation_tracking_shop_created_idx
  ON public.citation_tracking (shop_id, created_at DESC);

-- ============================================
-- 3. RLS
-- ============================================

ALTER TABLE public.citation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citation_tracking ENABLE ROW LEVEL SECURITY;

-- citation_questions: SELECT = 소유자 + admin
CREATE POLICY citation_questions_select_own
  ON public.citation_questions
  FOR SELECT
  TO authenticated
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
    OR public.is_admin()
  );

-- citation_tracking: SELECT = 소유자 + admin
CREATE POLICY citation_tracking_select_own
  ON public.citation_tracking
  FOR SELECT
  TO authenticated
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
    OR public.is_admin()
  );

-- INSERT/UPDATE/DELETE 정책 없음
-- → authenticated 기본 deny, service_role(RLS 우회)만 쓰기 가능

-- ============================================
-- ROLLBACK (수동 실행용)
-- ============================================
-- DROP TABLE IF EXISTS public.citation_tracking;
-- DROP TABLE IF EXISTS public.citation_questions;
-- (인덱스/정책/COMMENT/트리거는 CASCADE로 자동 삭제)
