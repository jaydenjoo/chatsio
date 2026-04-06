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

### 2026-04-06 — [Security/Architecture] 미들웨어 쿠키 캐싱은 보안 경계가 아니다
- **증상**: Task 1-7 리뷰에서 `onboarding_done=1` 쿠키 조작으로 온보딩 미완료 유저가 대시보드 UI 우회 접근 가능 (HIGH 판정)
- **원인**: Session #6에서 성능 최적화 목적으로 미들웨어에 `onboarding_done` 쿠키 캐싱을 추가했는데, 쿠키는 클라이언트가 임의 조작 가능하므로 **보안 판단 근거로 사용 불가**. 당시엔 성능 이슈(매 요청 DB 쿼리)를 해결하는 데 집중하느라 "쿠키 = 신뢰할 수 없는 데이터"라는 원칙을 놓침.
- **해결**: `(dashboard)/layout.tsx`를 async Server Component로 전환하여 **매 요청 DB 검증**을 수행. 미들웨어 쿠키 캐싱은 UX용 빠른 리다이렉트 로직으로 역할 재정의. 한 곳 수정으로 `(dashboard)/*` 전체 보호.
- **규칙**:
  1. **쿠키 ≠ 보안 경계**. 쿠키는 UX 힌트용. 실제 권한 검증은 서버에서 DB 또는 JWT 재검증으로.
  2. **Next.js 15 보안 레이어링**: 미들웨어는 "빠른 리다이렉트/라우팅", Server Component layout은 "진짜 보안 경계", Server Action은 "최종 데이터 검증". 세 레이어 역할을 혼동하지 말 것.
  3. **성능 최적화 vs 보안**: 캐싱으로 성능 개선할 때 **항상 신뢰 경계를 재확인**. "성능을 위해 검증을 스킵"은 위험 신호.
  4. **Task 내 리뷰 사이클**: Session #6처럼 5~6 Task 누적 후 한번에 리뷰하면 이런 보안 이슈가 늦게 잡힘. Task 완료마다 즉시 리뷰하면 3~4 Task의 파급 전에 차단 가능.

### 2026-04-06 — [AI-Pitfall] Injection 방어 시 과잉 이스케이프로 정상 UX 손상
- **증상**: getProducts `.or()` PostgREST injection 방어를 위해 `,` `(` `)` `.`를 모두 제거했더니 한국 상품명 검색 UX가 망가짐 (예: "ABC Co., Ltd." → "ABC Co Ltd", "나이키(운동화)" → "나이키운동화")
- **원인**: "PostgREST 메타문자"라는 관점에서 의심 문자를 전부 제거하는 방어적 접근. 하지만 PostgREST에서 `.or()`의 실제 **조건 구분자는 `,` 하나뿐**. `(` `)` `.`는 값 위치에서 리터럴로 취급됨. 과잉 이스케이프였음.
- **해결**: `.replace(/,/g, "")`로 쉼표만 제거. LIKE 와일드카드(`%` `_` `\`)는 별도 이스케이프. injection 표면은 `.eq("shop_id")` 체인 + RLS로 계속 차단.
- **규칙**:
  1. **방어 대상을 정확히 알고 최소 범위로 이스케이프**. "의심스러운 문자 전부 제거"는 UX 비용이 큼.
  2. **PostgREST `.or()` 구분자는 `,` 단 하나**. 값 위치의 `(` `)` `.` `:`는 리터럴. 공식 문법을 확인하지 않고 추측으로 방어하지 말 것.
  3. **한국어 사용자 데이터**: 상품명/업체명에 `,` `.` `(` `)` `%` 등이 매우 흔함. 이스케이프 시 "정상 입력이 살아남는가"를 먼저 테스트.
  4. **보안 리뷰는 2단계**: 1차(공격 차단) + 2차(정상 UX 유지). code-reviewer가 이 UX 손상을 잡아냈음 — **품질 리뷰가 보안 리뷰의 과잉을 견제**하는 구조가 중요.

### 2026-04-05 — [AI-Pitfall] shadcn/ui init이 디자인 시스템 CSS 변수 덮어쓰기
- **증상**: `npx shadcn@latest init` 실행 후 `--primary`, `--secondary` 등이 oklch 값으로 교체됨
- **원인**: shadcn이 globals.css의 `:root`와 `.dark` 블록에 자체 변수를 주입
- **해결**: shadcn 변수를 Chatsio 디자인 토큰으로 재매핑 (`--background: var(--surface)` 등)
- **규칙**: shadcn init 후 반드시 globals.css 검증. `oklch` 검색 → 디자인 토큰으로 교체. shadcn 호환 변수는 `var(--our-token)` 형태로 매핑.
