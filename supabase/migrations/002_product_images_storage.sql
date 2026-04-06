-- ============================================================
-- Chatsio — product-images 버킷 설정 + Storage RLS
-- Task 1-7.5: 이미지 업로드 기능 지원
--
-- 이 파일은 Supabase MCP `apply_migration`을 통해 이미 DB에 적용된
-- 마이그레이션을 소스 컨트롤에 기록한다. 백업 복원 / 프로젝트 재생성 시
-- 동일한 상태로 재현 가능하도록 한다.
--
-- 적용 일시 (DB): 2026-04-06
-- 마이그레이션 이름:
--   - add_image_to_product_source_enum
--   - product_images_storage_rls_and_config
-- ============================================================

-- 1) product_source enum에 'image' 값 추가
--    URL/CSV/Cafe24 API 외에 직접 이미지 업로드로 등록한 상품을 구분.
--    감사 로그 / KPI 분기 용도.
ALTER TYPE public.product_source ADD VALUE IF NOT EXISTS 'image';

-- 2) product-images 버킷 설정 업데이트
--    파일 크기 상한: 5MB per file
--    허용 MIME: JPEG, PNG, WebP (Storage 레벨 최종 방어선)
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'product-images';

-- 3) 느슨한 기존 INSERT 정책 제거
--    기존 "Users can upload product images"는 bucket_id 체크만 있어서
--    anon 키로도 업로드 가능한 공백이 있었음. 제거 후 강화된 정책으로 교체.
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;

-- 4) 강화된 INSERT 정책
--    - authenticated role만 허용
--    - 경로 첫 폴더(shop_id)가 요청자의 shop_id와 일치해야 함
--    - `storage.foldername(name)`는 객체 경로를 `/`로 split한 배열 반환
CREATE POLICY "shop_owners_upload_product_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT s.id::text FROM public.shops s WHERE s.user_id = auth.uid()
  )
);

-- 5) DELETE 정책
--    본인 shop 경로의 파일만 삭제 가능.
--    createProductWithImages의 rollback 로직에서 사용됨.
CREATE POLICY "shop_owners_delete_product_images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT s.id::text FROM public.shops s WHERE s.user_id = auth.uid()
  )
);

-- ============================================================
-- 롤백 SQL (재난 복구용 — 실제로 실행하지 말 것)
-- ============================================================
-- DROP POLICY IF EXISTS "shop_owners_upload_product_images" ON storage.objects;
-- DROP POLICY IF EXISTS "shop_owners_delete_product_images" ON storage.objects;
-- UPDATE storage.buckets
--   SET file_size_limit = NULL, allowed_mime_types = NULL
--   WHERE id = 'product-images';
-- CREATE POLICY "Users can upload product images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'product-images');
-- 주의: ALTER TYPE은 enum 값 제거 불가. 'image' 값 롤백은 enum 재생성이 필요.
