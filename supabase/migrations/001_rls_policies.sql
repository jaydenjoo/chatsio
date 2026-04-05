-- ============================================================
-- Chatsio V2 — RLS 정책
-- 모든 테이블에 RLS 활성화 + 역할 기반 접근 제어
-- ============================================================

-- 헬퍼 함수: 현재 사용자의 역할 조회
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- 헬퍼 함수: admin 여부
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.get_user_role() = 'admin';
$$;

-- ============================================================
-- 1. user_profiles
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필 조회
CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

-- 본인 프로필 수정
CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT는 auth trigger로만 (아래 trigger 참조)
CREATE POLICY "user_profiles_insert_trigger"
  ON public.user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 2. shops
-- ============================================================
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shops_select_own"
  ON public.shops FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "shops_insert_own"
  ON public.shops FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "shops_update_own"
  ON public.shops FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "shops_delete_own"
  ON public.shops FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 3. products
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_own"
  ON public.products FOR SELECT
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "products_insert_own"
  ON public.products FOR INSERT
  WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
  );

CREATE POLICY "products_update_own"
  ON public.products FOR UPDATE
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
  );

CREATE POLICY "products_delete_own"
  ON public.products FOR DELETE
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
  );

-- ============================================================
-- 4. optimizations
-- ============================================================
ALTER TABLE public.optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "optimizations_select_own"
  ON public.optimizations FOR SELECT
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "optimizations_insert_own"
  ON public.optimizations FOR INSERT
  WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
  );

CREATE POLICY "optimizations_update_own"
  ON public.optimizations FOR UPDATE
  USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
  );

-- optimizations 삭제 불가 (이력 보존)

-- ============================================================
-- 5. prompts (어드민만 쓰기, 모든 인증 사용자 읽기)
-- ============================================================
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompts_select_authenticated"
  ON public.prompts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "prompts_insert_admin"
  ON public.prompts FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "prompts_update_admin"
  ON public.prompts FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "prompts_delete_admin"
  ON public.prompts FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- 6. prompt_versions (어드민만 쓰기, 모든 인증 사용자 읽기)
-- ============================================================
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_versions_select_authenticated"
  ON public.prompt_versions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "prompt_versions_insert_admin"
  ON public.prompt_versions FOR INSERT
  WITH CHECK (public.is_admin());

-- prompt_versions 수정/삭제 불가 (버전 히스토리 보존)

-- ============================================================
-- Auth Trigger: 회원가입 시 user_profiles 자동 생성
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- 기존 트리거가 있으면 제거 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
