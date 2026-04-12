-- 009: prompt_versions에 UNIQUE 제약 추가
-- 동시 저장 시 버전 번호 중복 방지 (TOCTOU 방어)

ALTER TABLE prompt_versions
  ADD CONSTRAINT prompt_versions_prompt_id_version_unique
  UNIQUE (prompt_id, version);

-- 롤백
-- ALTER TABLE prompt_versions DROP CONSTRAINT prompt_versions_prompt_id_version_unique;
