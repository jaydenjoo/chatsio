---
globs: "**/supabase/**,**/db/**,**/*.sql"
---
# Supabase 규칙
- RLS 정책 반드시 설정 (예외 없음)
- select('*') 금지 → 필요한 컬럼만 명시
- { data, error } 구조분해 후 error 체크 필수
- 마이그레이션에 롤백 SQL 함께 작성
- 타입: supabase gen types로 생성 → types/database.ts
