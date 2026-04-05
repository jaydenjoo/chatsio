# nextjs Learnings

> 에러 패턴, AI 실수, 설계 결정을 기록. 같은 실수 반복 방지.

## Format
```
### YYYY.MM.DD — [Category] Title
- **Problem**: 무엇이 문제였나
- **Root Cause**: 원인
- **Solution**: 해결법
- **Prevention**: 재발 방지 방법
```

## Categories
- `[Bug]` — 버그 발견/수정
- `[AI-Pitfall]` — AI가 반복하는 실수
- `[Architecture]` — 설계 결정
- `[Performance]` — 성능 이슈
- `[Security]` — 보안 이슈

---

### 2026-04-05 — [Architecture] Supabase 무료 플랜 DB 직접 연결 불가
- **증상**: `drizzle-kit push` 시 `db.xxx.supabase.co` 호스트 DNS 해석 실패. Pooler도 "Tenant not found"
- **원인**: Supabase 무료 플랜에서 direct DB 연결 호스트가 DNS에 등록되지 않음 (2026년 기준)
- **해결**: Supabase MCP(`apply_migration`)로 DDL 실행. 런타임 쿼리는 Supabase JS 클라이언트 사용
- **규칙**: Supabase 무료 플랜에서 Drizzle ORM은 스키마 정의용으로만 사용. 실제 DB 조작은 Supabase MCP 또는 JS 클라이언트로.

### 2026-04-05 — [AI-Pitfall] shadcn/ui init이 디자인 시스템 CSS 변수 덮어쓰기
- **증상**: `npx shadcn@latest init` 실행 후 `--primary`, `--secondary` 등이 oklch 값으로 교체됨
- **원인**: shadcn이 globals.css의 `:root`와 `.dark` 블록에 자체 변수를 주입
- **해결**: shadcn 변수를 Chatsio 디자인 토큰으로 재매핑 (`--background: var(--surface)` 등)
- **규칙**: shadcn init 후 반드시 globals.css 검증. `oklch` 검색 → 디자인 토큰으로 교체. shadcn 호환 변수는 `var(--our-token)` 형태로 매핑.
