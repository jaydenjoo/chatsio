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

### 2026-04-06 — [Architecture] `"use server"` 파일은 동기 함수/상수 export 불가 → 공유 유틸 분리
- **증상**: Task 1-8에서 `actions.ts`("use server")에 `hasFormulaInjection()` 동기 함수와 `BULK_MAX_*` 상수를 정의하고 클라이언트 컴포넌트(`csv-upload-form.tsx`)에서 import하려고 했더니, Next.js 15 "use server" 제약으로 모든 export가 async Server Action으로 취급되어 동기 호출 불가
- **원인**: `"use server"` 파일의 모든 export는 RPC 엔드포인트가 됨. 동기 함수도 네트워크 왕복이 필요해지고, 행별 검증 시 100번의 HTTP 호출이 발생 (성능/UX 재앙). 상수도 RPC로 취급됨
- **해결**: `src/features/products/validation.ts` 별도 파일 신규 생성 (지시어 없음). `BULK_MAX_ROWS/NAME/URL` 상수 + `hasFormulaInjection()` 함수를 여기에 두고, `actions.ts`(서버)와 `csv-upload-form.tsx`(클라이언트) 양쪽에서 동일하게 import. `index.ts`에서 `validation.ts`의 심볼을 별도로 re-export
- **규칙**:
  1. **`"use server"` 파일에는 async Server Action만 둔다**. 상수/동기 유틸/타입가드/Zod 스키마는 사이드 파일로 분리
  2. **서버/클라이언트 공유 검증 로직**은 항상 `features/*/validation.ts` 같은 중립 파일에 모은다. 이 파일은 지시어 없이 양쪽에서 import 가능
  3. **Next.js 15에서 features 폴더 구조**: `actions.ts` (use server) + `validation.ts` (공유) + `components/*.tsx` (use client) + `index.ts` (barrel)로 3-4파일 분할이 안전한 패턴

### 2026-04-06 — [Security] CSV Formula Injection 유니코드 우회 (full-width, NBSP)
- **증상**: Task 1-8 보안 리뷰에서 `FORMULA_PREFIX = /^[=+\-@\t\r]/` 정규식이 ASCII 코드포인트만 잡음을 발견. 다음 페이로드가 우회됨:
  - `＝SUM(A1:A10)` — full-width `＝` (U+FF1D)는 `=`(U+003D)가 아니므로 정규식 통과
  - `\u00A0=HYPERLINK("http://evil.com","click")` — NBSP(U+00A0)는 JavaScript `String.trim()`에 제거되지 않으므로 leading whitespace 후 `=` 탐지 실패
  - `\uFEFF=cmd` — BOM/ZWNBSP는 `\s`에 포함되지 않음
- **원인**: "OWASP Formula Injection" 기본 방어는 ASCII 프리픽스 체크만 다룸. 사용자 입력이 유니코드 전 영역이라는 것을 간과. 한국 사용자 CSV는 Excel/Numbers에서 저장되며 NBSP/full-width 문자가 섞여 올 가능성이 큼
- **해결**: `hasFormulaInjection()` 함수로 캡슐화 + 두 단계 정규화:
  ```ts
  const normalized = input.normalize("NFKC").replace(/^[\s\u00A0\uFEFF]+/, "");
  return /^[=+\-@\t\r]/.test(normalized);
  ```
  - `normalize("NFKC")`: full-width `＝＋－@` → ASCII `=+-@` 자동 변환
  - leading strip: 표준 whitespace + NBSP(U+00A0) + BOM(U+FEFF) 명시적 제거
- **규칙**:
  1. **유니코드 입력을 받는 모든 문자열 검증은 NFKC 정규화 후 검사**. full-width, 위첨자, 리가처 등 시각적으로 같은 문자의 다양한 코드포인트를 ASCII로 정규화
  2. **`.trim()` 믿지 말 것**. 표준 `trim()`은 NBSP(U+00A0)와 BOM(U+FEFF)을 제거하지 않음. 보안 목적이면 명시적 `/[\s\u00A0\uFEFF]+/` 패턴 사용
  3. **보안 검증 함수는 캡슐화**. 정규식을 호출부마다 복붙하지 말고 `hasFormulaInjection()` 같은 이름의 함수로 통일 → 이번처럼 우회가 발견됐을 때 한 곳만 수정
  4. **learnings.md "과잉 이스케이프" 교훈과의 균형**: 방어 대상을 정확히 좁혀 이스케이프하되, 유니코드 우회는 반드시 정규화 단계를 거친 후 검사. "최소 방어"와 "충분한 방어"는 병립 가능

### 2026-04-06 — [AI-Pitfall] React 19 `react-hooks/set-state-in-effect` — mounted flag 패턴 금지
- **증상**: Task 1-10 다크모드 토글 첫 구현에서 `useEffect(() => { setMounted(true); }, [])` 패턴으로 SSR hydration mismatch를 회피하려 했더니, `pnpm lint`에서 `react-hooks/set-state-in-effect` 에러 발생 — "Calling setState synchronously within an effect can trigger cascading renders". React 19의 새 린터 규칙이 이 관용 패턴을 안티패턴으로 분류.
- **원인**: React 19 공식 가이드라인이 "`useEffect` 바디에서 `setState` 직접 호출"을 cascading render 유발 패턴으로 규정. 대신 `useSyncExternalStore` 또는 CSS-only 접근을 권장. 지난 수년간 next-themes 커뮤니티에서 관용적으로 쓰이던 `mounted` flag 패턴이 이제 린트 게이트를 통과하지 못함.
- **해결**: CSS-only 아이콘 스왑으로 전환. `<Moon className="dark:hidden" />` + `<Sun className="hidden dark:block" />`. next-themes가 하이드레이션 **전에** `<html>`에 `.dark` 클래스를 주입하므로 JS 없이 Tailwind `dark:` variant만으로 정확한 아이콘이 초기 렌더됨. mounted flag 완전 제거.
- **규칙**:
  1. **React 19에서 `useEffect` + `setState` 마운트 플래그 패턴 금지**. 린터가 잡아줌. 대안: ① CSS-only (`dark:` variant 등 class 기반 스타일 토글), ② `useSyncExternalStore`로 외부 상태 구독, ③ `suppressHydrationWarning`로 mismatch 무해화 — 이 3가지 중 상황에 맞게 선택.
  2. **next-themes + Tailwind 조합의 정석은 CSS-only**. `attribute="class"` + `<html>.dark` 토글 + `dark:` variant로 JS 의존 없이 FOUC-free 전환 가능. mounted 패턴은 aria-label 같은 텍스트 속성이 테마에 따라 바뀔 때만 필요하고, 그 경우는 `aria-pressed`로 대체하는 게 더 깔끔.
  3. **새 React/Next.js 버전 업그레이드 후 "당연히 되던" 패턴 재검증**. 린터 규칙은 버전업마다 추가/강화됨. 관용 패턴이 갑자기 안티패턴이 될 수 있음.

### 2026-04-06 — [Architecture] next-themes + SSR에서 `aria-pressed`가 동적 aria-label보다 안전
- **증상**: Task 1-10 code-reviewer 리뷰에서 HIGH — "aria-label이 정적이라 스크린리더가 현재 상태를 알 수 없다"는 지적. 첫 반응은 `useTheme()`에서 `resolvedTheme`을 읽어 `` `${isDark ? "라이트" : "다크"} 모드로 전환` ``으로 동적 라벨 생성하는 것이었음. 그런데 서버는 테마를 모르므로 SSR에서 `resolvedTheme === undefined` → 기본 분기("다크 모드로 전환") 렌더. 클라이언트 하이드레이션 직후에도 여전히 `undefined` (next-themes가 effect로 주입). 사용자가 이미 다크 모드인 상태로 접속하면 서버는 "다크 모드로 전환"이라고 속삭이는 **거짓 안내** 상태로 첫 paint를 렌더.
- **원인**: SSR에서는 사용자 테마 선호를 알 수 없음(쿠키로 전달하지 않는 한). `next-themes`는 의도적으로 첫 렌더에서 `resolvedTheme`을 `undefined`로 반환 → 클라이언트 마운트 후 script가 `<html>` class를 읽고 값을 주입. 즉 **aria-label을 동적 텍스트로 만들면 하이드레이션 전 구간에서 스크린리더에 잘못된 안내가 나감**.
- **해결**: `aria-label`은 정적 "다크 모드 토글" 유지 + `aria-pressed={resolvedTheme === "dark"}` 추가. `undefined === "dark"`는 `false`로 평가되므로 서버와 클라이언트 첫 렌더 모두 `aria-pressed="false"`로 일치 → hydration mismatch 없음. 이후 next-themes가 실제 값을 주입하면 React가 자연스럽게 업데이트. 스크린리더는 "토글 버튼, 눌림/눌리지 않음" 상태를 표준 방식으로 안내.
- **규칙**:
  1. **SSR 환경에서 토글 버튼 접근성은 `aria-pressed` 우선**. 동적 `aria-label` 텍스트는 하이드레이션 전에 거짓 안내를 낼 수 있음. `aria-pressed`는 boolean이라 `undefined === "dark" → false` 같은 일관된 초기값이 가능.
  2. **`undefined === value` 비교는 hydration 친화적**. 서버/클라이언트가 같은 `undefined`를 쓰는 한 mismatch가 나지 않음. 이걸 역이용해서 "아직 모름" 상태를 "기본값"으로 자연스럽게 처리.
  3. **보안 규칙과 동일한 원칙이 a11y에도 적용**: "서버가 모르는 상태를 클라이언트 값으로 추측하지 말 것". Session #7의 "쿠키 ≠ 보안 경계" 교훈과 구조가 같음 — 서버가 진실을 모르면 UX 상에서도 **중립 상태**로 렌더해야 함. 추측 렌더는 사용자에게 잘못된 정보를 짧은 시간이라도 보여주게 됨.
  4. **code-reviewer의 리뷰 제안을 그대로 따르지 말 것**. 리뷰어는 "Option A — 동적 aria-label"과 "Option B — aria-pressed" 중 Option A를 더 흔하다고 소개했으나, SSR 특성상 Option B가 본질적으로 안전. **리뷰 제안은 힌트이지 정답이 아님** — 프로젝트 컨텍스트(SSR, next-themes)를 감안해 직접 판단.

### 2026-04-05 — [AI-Pitfall] shadcn/ui init이 디자인 시스템 CSS 변수 덮어쓰기
- **증상**: `npx shadcn@latest init` 실행 후 `--primary`, `--secondary` 등이 oklch 값으로 교체됨
- **원인**: shadcn이 globals.css의 `:root`와 `.dark` 블록에 자체 변수를 주입
- **해결**: shadcn 변수를 Chatsio 디자인 토큰으로 재매핑 (`--background: var(--surface)` 등)
- **규칙**: shadcn init 후 반드시 globals.css 검증. `oklch` 검색 → 디자인 토큰으로 교체. shadcn 호환 변수는 `var(--our-token)` 형태로 매핑.
