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

### 2026-04-06 — [CRITICAL] 공유 Supabase 프로젝트에서 V1 DROP 시 다른 앱 테이블까지 삭제
- **증상**: Session #4에서 "V1 테이블 전체 DROP" 실행 → Chatsio가 아닌 Findably 테이블까지 삭제됨
- **원인**: Supabase 무료 플랜 제약으로 Chatsio + Findably가 동일 프로젝트(`chatsio-v1`) public 스키마 공유. "전체 DROP" 스코프를 Chatsio로 한정하지 않고 실행
- **해결**: Findably 쪽에서 재마이그레이션하여 복구. 메모리에 DB 경계 규칙 영구 저장 (`findably_db_boundary.md`)
- **규칙**:
  1. **공유 DB에서 절대 "전체 DROP" 금지** — 반드시 테이블명 명시 + `IF EXISTS`
  2. **작업 전 `list_tables`로 영향 범위 확인** — 모르는 테이블 보이면 즉시 중단
  3. **"내가 만든 것만 건드린다"** — Chatsio 작업 중 Chatsio PRD에 명시된 테이블만 조작
  4. **대규모 스키마 리셋 전 Jayden에게 확인 필수** — 특히 🔴 프로젝트

### 2026-04-06 — [Security] 코드 리뷰 미루면 CRITICAL 보안 이슈 누적
- **증상**: 5세션 동안 리뷰 없이 진행 후 전체 리뷰 시 CRITICAL 5개, HIGH 8개 발견 (총 25개)
- **원인**: Task 완료 후 바로 다음 Task로 넘어가며 리뷰 스킵. 인증(🔴) 코드도 리뷰 없이 머지
- **해결**: 3개 병렬 리뷰 에이전트로 일괄 리뷰 + 수정
- **규칙**: 🔴 보안 등급 코드(인증/결제/OAuth)는 Task 완료 즉시 리뷰 필수. 일반 코드도 2~3 Task마다 리뷰.

### 2026-04-06 — [AI-Pitfall] Server Action에서 `formData.get() as string` 강제 캐스팅
- **증상**: `formData.get("email") as string`이 null/File일 때 타입 에러 없이 통과
- **원인**: AI가 Server Action 생성 시 FormData를 Zod 없이 `as string` 캐스팅하는 패턴 반복 사용
- **해결**: Zod 스키마 정의 + `safeParse` 후 `parsed.data` 사용
- **규칙**: Server Action에서 FormData 접근 시 반드시 Zod 스키마로 파싱. `as string` 캐스팅 절대 금지.

### 2026-04-05 — [AI-Pitfall] shadcn/ui init이 디자인 시스템 CSS 변수 덮어쓰기
- **증상**: `npx shadcn@latest init` 실행 후 `--primary`, `--secondary` 등이 oklch 값으로 교체됨
- **원인**: shadcn이 globals.css의 `:root`와 `.dark` 블록에 자체 변수를 주입
- **해결**: shadcn 변수를 Chatsio 디자인 토큰으로 재매핑 (`--background: var(--surface)` 등)
- **규칙**: shadcn init 후 반드시 globals.css 검증. `oklch` 검색 → 디자인 토큰으로 교체. shadcn 호환 변수는 `var(--our-token)` 형태로 매핑.
