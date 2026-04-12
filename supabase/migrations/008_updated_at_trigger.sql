-- ============================================================
-- Chatsio — Migration 008: updated_at 자동 갱신 트리거
--
-- 문제:
--   모든 테이블의 updated_at 컬럼이 DEFAULT now()만 설정되어
--   INSERT 시점만 기록되고, UPDATE 시 자동 갱신되지 않음.
--   Session #31에서 진단 오류 유발 (learnings.md 참조).
--
-- 대상 테이블 (5개):
--   shops, products, optimizations, prompts, user_profiles
--
-- 롤백:
--   DROP TRIGGER IF EXISTS set_updated_at ON shops;
--   DROP TRIGGER IF EXISTS set_updated_at ON products;
--   DROP TRIGGER IF EXISTS set_updated_at ON optimizations;
--   DROP TRIGGER IF EXISTS set_updated_at ON prompts;
--   DROP TRIGGER IF EXISTS set_updated_at ON user_profiles;
--   DROP FUNCTION IF EXISTS public.set_updated_at();
-- ============================================================

-- 1. 공통 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 각 테이블에 BEFORE UPDATE 트리거 부착
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.optimizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
