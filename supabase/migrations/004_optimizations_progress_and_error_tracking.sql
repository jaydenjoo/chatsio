-- ============================================================
-- Chatsio — Task 2-3 Prerequisite
-- optimizations 테이블에 진행 단계 + 실패 단계 추적 컬럼 추가
--
-- 이 파일은 Supabase MCP `apply_migration`을 통해 DB에 적용된
-- 마이그레이션을 소스 컨트롤에 기록한다. 백업 복원 / 프로젝트 재생성 시
-- 동일한 상태로 재현 가능하도록 한다.
--
-- 목적:
--   1. Realtime 진행 표시 — processing_step (1~4)로 n8n 워크플로우의
--      각 단계를 사용자에게 시각화 (queued → step1 → step2 → ... → completed)
--   2. 실패 위치 추적 — error_step 텍스트로 "어느 단계에서 실패했나"를
--      사용자/운영자 모두에게 노출 (Jayden의 "에러 어디서 났는지 즉시
--      확인" 요구의 1차 구현)
--   3. failed_at 타임스탬프 — failure latency 측정 + Phase 4 모니터링
--
-- 단계 매핑 (processing_step):
--   1 = 상품 데이터 정규화 (normalize)
--   2 = AI 최적화 처리 (claude_call + parse)
--   3 = 결과 품질 검수 + 마무리 (finalize)
--   4 = DB 저장 (db_save)
--   null = 아직 시작 안 함 (status='queued') 또는 이미 종료 (completed/failed)
--
-- error_step 가능 값 (text, 자유):
--   'normalize' | 'claude_call' | 'json_parse' | 'finalize' | 'db_save' |
--   'webhook_auth' | 'validation' | 'unknown'
--
-- 적용 일시 (DB): 2026-04-07
-- 마이그레이션 이름: 004_optimizations_progress_and_error_tracking
-- ============================================================

ALTER TABLE public.optimizations
  ADD COLUMN IF NOT EXISTS processing_step integer,
  ADD COLUMN IF NOT EXISTS error_step text,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz;

-- 단계 값 검증 (nullable이지만, 값이 있으면 1~4만 허용)
ALTER TABLE public.optimizations
  ADD CONSTRAINT optimizations_processing_step_range
  CHECK (processing_step IS NULL OR (processing_step BETWEEN 1 AND 4));

-- 실패 단계 값 검증 — 자유 텍스트지만 공백/null byte 차단
ALTER TABLE public.optimizations
  ADD CONSTRAINT optimizations_error_step_length
  CHECK (error_step IS NULL OR char_length(error_step) BETWEEN 1 AND 64);

-- ============================================
-- ROLLBACK (수동 실행용)
-- ============================================
-- ALTER TABLE public.optimizations
--   DROP CONSTRAINT IF EXISTS optimizations_error_step_length,
--   DROP CONSTRAINT IF EXISTS optimizations_processing_step_range,
--   DROP COLUMN IF EXISTS failed_at,
--   DROP COLUMN IF EXISTS error_step,
--   DROP COLUMN IF EXISTS processing_step;
