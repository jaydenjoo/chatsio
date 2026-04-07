-- ============================================================
-- Chatsio — Task 2-3 Security Patch (H2)
-- optimizations에 partial unique index 추가 — 동일 (product_id, plan)에
-- 대해 queued/processing 상태인 row가 동시에 2건 이상 존재하지 못하도록
-- DB 레벨에서 차단.
--
-- 이 파일은 Supabase MCP `apply_migration`을 통해 DB에 적용된
-- 마이그레이션을 소스 컨트롤에 기록한다. 백업 복원 / 프로젝트 재생성 시
-- 동일한 상태로 재현 가능하도록 한다.
--
-- 문제 (code-reviewer + security-reviewer HIGH 동시 지적):
--   Server Action runOptimization의 "5분 중복 체크 → INSERT" 흐름은
--   SELECT와 INSERT 사이에 race window가 있다. 매 요청마다 새
--   idempotency_key(UUID)를 생성하므로 기존 UNIQUE(idempotency_key)
--   제약으로는 (product_id, plan) 단위 중복을 막을 수 없다.
--   빠른 더블 클릭 / Promise.all 공격 시 n8n이 2번 호출되어
--   Anthropic API 비용이 배가된다.
--
-- 해결:
--   partial unique index를 생성해 "in-flight" 상태(queued/processing)
--   에서만 unique 제약을 적용한다. 완료된 row(completed/failed)는
--   재실행/재시도 시 인덱스에 포함되지 않아 자유롭게 새 row 생성 가능.
--
--   동시 INSERT 시도 시 둘째 INSERT가 DB 제약 위반 (Postgres 23505)으로
--   실패하고 Server Action이 N8N 호출 전에 catch → 사용자에게
--   "이미 진행 중" 안내.
--
-- 적용 일시 (DB): 2026-04-07
-- 마이그레이션 이름: 005_optimizations_active_unique_partial_index
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS optimizations_active_unique
  ON public.optimizations (product_id, plan)
  WHERE status IN ('queued', 'processing');

-- ============================================
-- ROLLBACK (수동 실행용)
-- ============================================
-- DROP INDEX IF EXISTS public.optimizations_active_unique;
