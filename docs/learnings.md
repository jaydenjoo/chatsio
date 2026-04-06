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

### 2026-04-06 — [Bug/Build] Turbopack dev CSS 파서가 production build보다 엄격 — `@import` 위치
- **증상**: Task 1-10 완료 후 Playwright QA 시작하자마자 `/login` 500 에러. 콘솔에 `./src/app/globals.css:6696:8 Parsing CSS source code failed` + `@import rules must precede all rules aside from @charset and @layer statements`. 그런데 같은 코드가 **pnpm build는 통과**했음. dev만 실패.
- **원인**: CSS 스펙상 `@import`는 `@charset`/`@layer` 외의 모든 규칙보다 파일 최상단에 와야 함. globals.css에 `@import "tailwindcss"` → `@import url("...pretendard...")` → `@import "tw-animate-css"` 순서로 되어 있었는데, Tailwind v4의 `@import "tailwindcss"`가 PostCSS 확장되면 **수천 줄의 내부 규칙**이 인라인으로 펼쳐져 CDN Pretendard `@import`가 다른 규칙들 뒤로 밀려나 스펙 위반. **build는 PostCSS가 모든 @import를 빌드 시점에 inline 처리하여 관대**하지만, **Turbopack dev는 CSS 파서가 스펙을 엄격 적용**.
- **해결**: CDN `@import url(...)`을 `@import "tailwindcss"`보다 **앞으로** 이동. 모든 `@import`가 파일 최상단에 연속 배치되면 순서는 상관없음. 1줄 이동으로 즉시 해결.
- **규칙**:
  1. **`pnpm build` 통과 ≠ `pnpm dev` 정상 동작**. Turbopack dev 파서는 production build보다 CSS 스펙을 더 엄격하게 적용. 검증 게이트에 `typecheck + lint + build`만 있으면 dev 환경 버그를 놓칠 수 있음. **실제 브라우저로 dev 서버 확인**이 진짜 검증의 마지막 단계.
  2. **CSS `@import` 위치 규칙**: 모든 `@import`는 파일 최상단에 연속 배치. `@charset`과 `@layer`만 더 앞에 허용. 다른 규칙(변수 정의, 주석 블록, 셀렉터)이 중간에 끼면 후속 `@import`는 스펙 위반.
  3. **Tailwind v4 + CDN 폰트 조합 시 주의**: `@import "tailwindcss"`는 확장되면 매우 길어짐. **CDN/외부 `@import url(...)`는 반드시 `@import "tailwindcss"`보다 앞**에 배치해야 안전. 또는 `next/font`로 로컬 호스팅 전환.
  4. **Playwright QA는 dev 전용 버그 탐지의 마지막 방어선**. 타입 체크와 빌드로 잡히지 않는 런타임/파서 버그(이 케이스)는 실제 서버 실행 + 페이지 접근으로만 드러남. 주요 Task 완료 후 최소 1회 Playwright로 핵심 페이지 돌려보는 게 원칙.
  5. **Turbopack에 의존하지 않는 추가 예방**: 주기적으로 `pnpm dev` 수동 실행 또는 CI에 smoke test 추가. "빌드는 되는데 dev는 500" 같은 환경 격차를 조기에 감지.

### 2026-04-06 — [AI-Pitfall] `.gitignore` ≠ ESLint ignore — 툴별 ignore는 독립적
- **증상**: Task 1-10 완료 후 `._*` AppleDouble 파일 정리 작업에서 `git rm --cached`로 21개 파일을 untrack하고 `.gitignore`에 `._*` 패턴도 확인했는데도 `pnpm lint`에서 여전히 107개 "Parsing error: Invalid character" 발생. "gitignore에 넣었으니 당연히 lint도 무시하겠지"라는 기본 가정이 틀렸음.
- **원인**: `.gitignore`는 **git이 tracking하는 파일**을 제어할 뿐, 다른 도구의 파일 시스템 스캔에는 영향이 없음. ESLint는 git과 완전히 독립적으로 프로젝트 디렉터리를 재귀 스캔 → ignore 설정을 ESLint 자체 설정(`eslint.config.mjs`의 `globalIgnores`)에 넣어야 함. Prettier(`.prettierignore`), TypeScript(`tsconfig.json`의 `exclude`), Vitest(`test.exclude`) 등 모든 도구가 **각자의 ignore 설정을 가짐**.
- **해결**: `eslint.config.mjs`의 `globalIgnores` 배열에 `"**/._*"` 패턴 추가. 즉시 107 → 0 에러.
  ```js
  globalIgnores([
    ".next/**",
    "out/**",
    // ...
    "**/._*",  // macOS AppleDouble
  ]),
  ```
- **규칙**:
  1. **"git이 무시한다" ≠ "모든 도구가 무시한다"**. 파일 시스템 레벨 도구(ESLint, Prettier, TypeScript, test runner, bundler)는 각자 독립적인 ignore 설정을 가짐. 한 번에 모두 정리하려면 프로젝트별로 필요한 ignore 설정들을 체크리스트로 관리.
  2. **노이즈가 지속되는 lint/typecheck 에러는 뿌리를 뽑는다**. 매 세션마다 `grep -v`로 필터링하고 있다면 이미 root cause 해결이 늦어진 상태. "검증 게이트 노이즈 = 기술 부채"로 취급하고 작은 세션에 집중 정리.
  3. **"X를 고쳤는데 Y가 안 변함" 패턴에서 의심할 점**: 두 도구가 사실 같은 설정을 공유하고 있다는 가정이 틀렸을 수 있음. 각자의 설정 파일을 독립적으로 확인.
  4. **이 교훈은 다른 도구에도 일반화**: `.dockerignore`, `.prettierignore`, Jest `testPathIgnorePatterns`, Vite `server.watch.ignored` 등 모두 같은 패턴. 새 툴 도입 시 "이 툴의 ignore 설정은 무엇인가?"를 체크.

### 2026-04-06 — [Environment/Critical] Turbopack LevelDB persistence × exFAT 외장 SSD 비호환
- **증상**: Session #10에서 루트 `/` 랜딩 placeholder 구현 후 `pnpm dev` 시작 시 `[Error: Failed to open database / Caused by: Loading persistence directory failed / invalid digit found in string]` 에러. `pnpm build`와 `pnpm lint`는 통과하지만 **dev server만 시작 불가**. `.next` 캐시를 완전히 지워도 재발. Session #9의 "Turbopack dev 500 에러"(globals.css `@import` 위치)와 증상이 비슷하지만 완전히 다른 원인.
- **원인 깊이 분석**:
  1. 프로젝트가 외장 SSD `/Volumes/jayden-ssd`에 있었고 이 볼륨은 **exFAT** 파일시스템이었음 (`diskutil info`로 확인). exFAT는 Windows 호환용이지만 **macOS의 xattr(extended attributes) 저장 공간 없음**
  2. macOS는 보존 못 하는 xattr을 `._원본파일명` 형태의 **AppleDouble 파일**로 분리 저장 → 모든 파일 옆에 그림자 파일이 자동 생성됨
  3. Next.js 16.2 Turbopack은 Rust 기반 LevelDB를 persistence 캐시로 사용. `.next/dev/cache/turbopack/<hash>/` 경로에 `.sst`, `CURRENT`, `LOG`, `MANIFEST-*` 파일 생성
  4. 외장 SSD에서는 `._00000001.sst`, `._CURRENT` 같은 가짜 AppleDouble 파일이 LevelDB 파일 옆에 자동 생성
  5. LevelDB 로더가 디렉토리를 스캔하며 `._*` 파일을 진짜 SST 파일로 오인 → 파일 헤더의 버전 숫자(매직 바이트)를 파싱하려다 Rust `str::parse` 실패 → "invalid digit found in string" panic
  6. **빌드는 왜 통과했나**: `next build`는 LevelDB persistence를 쓰지 않고 static/SSG 결과만 생성. dev는 incremental caching을 위해 LevelDB 필수.
- **해결 여정**:
  1. 1차 시도 — `.next` 전체 삭제 후 재시작 → **재현** (원인이 `.next` 외부에 있음을 확인)
  2. 2차 시도 — `find .next -name '._*' -delete` 정리 후 재시작 → dev 시작 중 파일이 재생성되어 **재현**
  3. 3차 시도 — `next dev --webpack` 플래그로 Turbopack 우회 → **성공** (webpack은 LevelDB 미사용)
  4. 근본 해결 — 프로젝트를 **내장 SSD (APFS)로 전체 이동** → Turbopack 정상 작동 (`Ready in 248ms`)
- **왜 Session #9의 AppleDouble 정리 작업으로 방지 못 했나**:
  - Session #9에서는 git tracked `._*` 21개 정리 + ESLint ignore만 추가
  - **파일시스템 자체가 exFAT인 한 AppleDouble은 매번 자동 재생성**됨. 정리는 임시방편이었을 뿐
  - 이번엔 Turbopack이 `.next` 내부의 AppleDouble을 보기 전에 막을 방법이 없었음 (생성 속도 vs 읽기 속도 경쟁)
- **규칙**:
  1. **macOS에서 Node.js/Next.js 프로젝트는 반드시 APFS 파일시스템에 둘 것**. 외장 드라이브가 exFAT/FAT32이면:
     - a) 내장 SSD로 이동 (가장 간단), 또는
     - b) 외장을 APFS로 재포맷(Mac 전용 포기), 또는
     - c) 2-파티션(APFS + exFAT)으로 분할, 또는
     - d) exFAT 안에 APFS sparsebundle 이미지 생성 후 그 안에서 작업
  2. **새 외장 드라이브 구매/포맷 시 파일시스템 매트릭스**:
     - Mac 전용 개발 → **APFS**
     - Windows 공유만 → exFAT
     - Mac 개발 + Windows 공유 → 2-파티션 또는 sparsebundle
  3. **"invalid digit / invalid number / parse error"가 빌드 툴/런타임에서 나면 파일시스템 아티팩트 의심**: macOS `._*`, Windows `desktop.ini`/`Thumbs.db`, Linux `.directory`/`.Trash-*` 등 숨김 메타데이터 파일이 스캐너에 껴들어가는 케이스
  4. **Session #9 "빌드 통과 ≠ dev 통과" 교훈 연장**: 이번엔 CSS import 순서가 아니라 파일시스템 호환성. dev server의 런타임 로더는 production build보다 더 엄격하고 신생 도구(Turbopack, Rust LevelDB)는 이런 edge case 방어가 부족. **Playwright/curl QA는 여전히 dev 전용 버그 탐지의 마지막 방어선**.
  5. **신생 도구 채택 전 파일시스템 호환성 검증**: Turbopack, Rspack, Bun, Vite 등의 "초고속" 도구는 대부분 Rust/네이티브 바인딩 + 바이너리 캐시 DB를 씀. 채택 전 "어떤 캐시 DB를 쓰는가?", "파일 이름 스캔 방식?", "AppleDouble 회피 패치 있는가?" 확인.
  6. **노이즈가 지속되는 환경 에러는 뿌리를 뽑는다**: learnings.md에 이미 "`.gitignore` ≠ ESLint ignore", "AppleDouble 메타데이터 정리" 교훈이 있었음. 같은 뿌리(**exFAT**)에서 나온 3번째 이슈가 이번. **한 번의 근본 조치(APFS 이동)가 세 번의 임시방편보다 낫다**.

### 2026-04-06 — [Process] macOS 프로젝트 경로 이동 템플릿 (exFAT → APFS)
- **증상/상황**: 위 exFAT × Turbopack 이슈의 근본 해결책으로 chatsio 프로젝트 전체를 `/Volumes/jayden-ssd/chatsio` → `/Users/jayden/projects/chatsio`로 이동해야 했음. Git 저장소, node_modules, 환경변수, Claude Code 메모리 디렉토리, 실행 중인 dev server 등 여러 상태를 동시에 안전하게 다뤄야 함.
- **성공한 프로세스 (복사부터 검증까지 소요 5분 미만)**:
  1. **사전 확인**: dev server PID(`lsof -i :3800`), git status, 내장 SSD 여유 공간(`df -h /`), 예상 복사 크기
  2. **dev server 종료**: `kill <pid>` (ungraceful OK, 파일 락 해제 목적)
  3. **대상 디렉토리 생성**: `mkdir -p /Users/jayden/projects`
  4. **rsync 복사** (최소 세트만):
     - `rsync -a --exclude='node_modules' --exclude='.next' --exclude='._*' --exclude='.DS_Store' src/ dst/`
     - `node_modules` 제외 이유: pnpm store로 재생성이 빠르고 깨끗 (exFAT 아티팩트 완전 배제)
     - `.next` 제외 이유: 재빌드 시 자동 생성
     - `._*` 제외 이유: 복사 시점에 AppleDouble 청소
  5. **복사 무결성 검증**: git status, git log, .env.local 존재, 중요 파일 크기/타임스탬프 확인
  6. **Claude Code 메모리 디렉토리 복사**:
     - 규칙: 프로젝트 경로의 `/` → `-`로 치환이 디렉토리 이름
     - 예: `/Volumes/jayden-ssd/chatsio` → `~/.claude/projects/-Volumes-jayden-ssd-chatsio/`
     - 예: `/Users/jayden/projects/chatsio` → `~/.claude/projects/-Users-jayden-projects-chatsio/`
     - `cp -a OLD/memory NEW/`로 MEMORY.md + 개별 메모리 파일 보존
  7. **새 위치에서 `pnpm install`**: pnpm의 content-addressable store가 기존 내려받은 패키지를 symlink로 링크 → 대형 프로젝트도 수 초 내 완료 (실측: 15GB node_modules → 3.4초)
  8. **검증 게이트**: `typecheck + lint + build` + dev server 실제 시작 + HTTP 200 확인
  9. **원본은 별도 승인 후 삭제**: 검증 완료 후에도 며칠 병행 유지해서 숨은 의존성 발견 시 롤백 가능하게 유지. Jayden 명시적 "삭제 OK" 전까지 보존.
- **실수할 뻔했던 부분**:
  1. 초반에 `.next` 전체를 `rm -rf`로 지우려다 careful hook 차단 발동 → 진단이 오히려 정확해지는 계기 (백업 가치 재확인)
  2. 이동 전에 랜딩 코드 변경사항을 커밋할까 고민 — rsync가 working tree + untracked 전부 복사하므로 커밋 없이도 안전하게 이동. 단, rsync 중단 리스크 대비해서는 사전 WIP 커밋도 나쁘지 않은 옵션
  3. 현재 Claude Code 세션의 cwd는 여전히 구 경로 → 새 경로 작업은 `cd /Users/jayden/projects/chatsio &&` 접두사 또는 **새 세션 시작**이 필요. Edit/Write/Read 같은 절대 경로 도구는 문제없음
- **규칙**:
  1. **프로젝트 이동은 Copy-Verify-Delete 3단계**로 분리. 절대 `mv`로 한 번에 하지 말 것. 원본이 며칠 더 보존되어야 복사본에서 발견되는 숨은 문제를 롤백 가능
  2. **node_modules는 복사 대신 재생성**: 파일시스템 변경(특히 exFAT → APFS) 시 권한/메타데이터 이관이 복잡. pnpm/npm/yarn store에서 재생성이 훨씬 깨끗하고 종종 더 빠름
  3. **Claude Code 메모리 디렉토리 이동을 잊지 말 것**: 프로젝트 경로가 바뀌면 메모리 디렉토리 이름도 바뀜. 놓치면 과거 세션에서 축적한 MEMORY.md + 개별 메모리 파일 유실. `~/.claude/projects/<프로젝트경로-대시치환>/memory/` 복사 필수
  4. **이동 후 반드시 Turbopack dev + curl HTTP로 실제 렌더링 검증**: typecheck/lint/build만으로는 환경 이슈를 못 잡음 (Session #9 교훈과 동일)
  5. **이동 후 PROGRESS.md에 경로 변경 사실을 맨 위에 명시**: 다음 세션에서 혼란 방지. "프로젝트 경로: `/Users/jayden/projects/chatsio/`" 한 줄이 미래 비용을 크게 줄임

### 2026-04-06 — [Security/Config] Next.js Server Actions bodySizeLimit 기본 1MB — 파일 업로드 시 반드시 override
- **증상**: Session #11에서 이미지 업로드(createProductWithImages) 구현 중 security-reviewer가 "next.config.ts에 bodySizeLimit이 없으면 정상 사용자도 5MB 이미지 2장 이상 업로드 불가"라고 지적. 실제로 Next.js 16.2 Server Actions의 기본 body size limit은 **1MB**. FormData로 5장×5MB=25MB를 전송하면 프레임워크 레벨에서 413 Payload Too Large로 잘리고 Server Action 자체가 실행되지 않음. 클라/서버 검증 코드는 아무것도 잡을 기회가 없음.
- **원인**: Next.js App Router Server Actions는 `fetch` API를 통해 RPC처럼 동작하지만, Next.js가 자체적으로 body size limit을 강제함 (DoS 방어 목적). 기본값 1MB는 폼 텍스트에 최적화된 값이고, 파일 업로드 유스케이스는 명시적 override가 필요. 문서에는 있지만 튜토리얼 레벨에는 노출되지 않아서 파일 업로드 기능 처음 만들 때 거의 확실히 걸림.
- **해결**: `next.config.ts`에 명시:
  ```ts
  const nextConfig: NextConfig = {
    experimental: {
      serverActions: {
        bodySizeLimit: "26mb", // IMAGE_MAX_FILES(5) × IMAGE_MAX_BYTES(5MB) + FormData overhead
      },
    },
  };
  ```
  숫자는 애플리케이션 상한 + 오버헤드(~1MB). 너무 크게 잡으면 DoS 표면이 증가하므로 실제 최대값 + 여유분만.
- **규칙**:
  1. **파일 업로드 Server Action 구현 시 맨 먼저 `next.config.ts` 수정**. 코드 짜고 나중에 "왜 413 에러?" 디버깅하지 말 것. 파일 업로드 Task 체크리스트에 "bodySizeLimit 확인" 포함.
  2. **bodySizeLimit 계산식**: `최대_파일수 × 최대_파일크기 + FormData_오버헤드(1MB)`. 예: 5×5MB+1=26MB. 오버헤드는 multipart boundary + JSON 필드 포함.
  3. **클라이언트 검증은 서버 진입 **전에** 동작하는 것이 아니다**. 클라 검증은 UX 용도이고, 프레임워크 body limit → RLS → Zod/수동 검증 → DB 제약 순서로 여러 겹이 쌓임. 첫 번째 장벽이 **Next.js 자체 limit**이라는 사실을 잊지 말 것.
  4. **MVP 범위 밖 일반화**: Express/Fastify/Hono 등 다른 프레임워크도 body limit 기본값이 있음. 새 백엔드 채택 시 "기본 body size limit은 얼마인가?"를 항상 확인. Next.js만의 함정이 아님.

### 2026-04-06 — [Security] 파일 업로드 MIME 검증은 magic bytes 필수 — `file.type`은 spoofing 가능
- **증상**: Task 1-7.5 초기 구현에서 `isAllowedImageMime(file.type)`으로만 MIME을 검증했는데, code-reviewer와 security-reviewer가 **둘 다 독립적으로** 같은 지적을 냄: "`File.type`은 브라우저가 확장자/OS MIME 레지스트리에서 추론한 값이라 사용자가 조작 가능. `exploit.html`을 `exploit.jpg`로 이름만 바꾸면 `file.type === 'image/jpeg'`로 서버에 도달". Supabase Storage 버킷의 `allowed_mime_types` 검사조차 client-sent Content-Type에 의존하므로 같은 방식으로 우회 가능.
- **원인**: `File.type`은 W3C File API 스펙에 따라 **UA가 추론한 MIME**을 반환. Chrome/Safari는 확장자 룩업 + 간단한 매직 바이트 sniff를 하지만, 공격자는 `new File([bytes], "a.jpg", { type: "image/jpeg" })`로 임의 값을 직접 설정하거나 FormData를 수동 조작해서 `Content-Type: image/jpeg` 헤더를 붙일 수 있음. 브라우저는 아무 방어를 안 함. 이 값을 서버가 신뢰하면 폴리글랏 공격 (JPEG 헤더 + HTML/JS body) + 클라이언트 측 MIME 우회가 뚫림.
- **해결**: `sniffImageMime()` 유틸 추가 — 실제 파일의 첫 12바이트를 읽어 magic number로 판별:
  ```ts
  export async function sniffImageMime(file: File): Promise<ImageMime | null> {
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    // JPEG: FF D8 FF
    if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
    // PNG: 89 50 4E 47
    if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "image/png";
    // WebP: "RIFF" + size + "WEBP"
    if (head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
        head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) return "image/webp";
    return null;
  }
  ```
  서버 액션에서 두 단계 검증: 1) `isAllowedImageMime(file.type)`로 빠른 거부 → 2) `sniffImageMime(file)`로 실제 바이트 확인 → 스니핑된 MIME을 `upload()`의 `contentType`으로 사용 (client-sent value 신뢰 제거).
- **규칙**:
  1. **클라이언트가 제공하는 모든 MIME 정보는 신뢰 불가**: `file.type`, `Content-Type` 헤더, 파일 확장자 전부. 서버는 반드시 실제 바이트를 확인.
  2. **magic bytes 테이블** (자주 쓰는 이미지):
     - JPEG: `FF D8 FF`
     - PNG: `89 50 4E 47 0D 0A 1A 0A`
     - WebP: `"RIFF" + 4바이트 size + "WEBP"`
     - GIF: `"GIF87a"` 또는 `"GIF89a"`
     - AVIF: `"ftyp" ... "avif"` (OFFSET 4, more complex)
  3. **Storage 버킷의 `allowed_mime_types`는 추가 방어선이지 유일한 방어선이 아니다**. Supabase도 client-sent `Content-Type`을 기준으로 하므로 서버 측 sniffing이 없으면 우회됨.
  4. **두 리뷰어가 동시에 같은 지적 = 반드시 수정**. 다른 카테고리(코드 품질 vs 보안)에서 온 리뷰가 동일 이슈를 지적하면 근본적 결함. 무시하거나 "나중에" 보류하지 말 것.
  5. **Phase 2 고려사항**: 현재는 헤더 12바이트만 검사. 더 엄격한 검증을 원하면 `sharp`/`file-type` 같은 라이브러리로 풀 decode 시도 (+ EXIF sanitization, + 이미지 resize). MVP에서는 magic bytes로 충분하고 Edge Function으로 분리할 때 라이브러리 추가.

### 2026-04-06 — [Security] Supabase Storage 버킷 생성 시 기본 RLS는 공백 — 항상 경로 스코프 강화
- **증상**: Task 1-7.5 구현 시작 시 `product-images` 버킷을 확인했는데 기존 `Users can upload product images` 정책이 이미 존재. 내용을 보니 `WITH CHECK (bucket_id = 'product-images')` **단일 조건**. `authenticated` role 체크도 없고, 경로 스코프 체크도 없음. **anon 키만 있으면 누구나 다른 사용자의 shop_id 경로로 파일을 업로드**할 수 있는 공백. Session #10 이전 어느 시점에 Supabase 대시보드 "Enable simple RLS" 또는 유사 기능으로 자동 생성된 것으로 추정.
- **원인**: Supabase는 새 Storage 버킷 생성 시 "Allow authenticated users" 같은 기본 템플릿을 버튼 클릭으로 추가할 수 있게 하는데, 이 템플릿이 **버킷 존재 확인** 수준의 느슨한 정책을 생성. 특히 Supabase 초기 setup wizard나 dashboard "Create bucket" 흐름에서 기본으로 제안됨. 개발자가 "정책이 이미 있네"라고 안심하고 넘어가기 쉬움.
- **해결**: 느슨한 정책 DROP → 강화된 정책 신규 생성:
  ```sql
  DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;

  CREATE POLICY "shop_owners_upload_product_images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (
      SELECT s.id::text FROM public.shops s WHERE s.user_id = auth.uid()
    )
  );
  ```
  핵심: `(storage.foldername(name))[1]`이 경로의 첫 폴더(객체 key를 `/`로 split한 배열)이고, 이것이 요청자의 `shops.id`와 일치해야만 업로드 허용. 업로드 코드에서 `{shop_id}/{product_id}/{filename}` 패턴을 강제하면 IDOR + 경로 주입 동시 차단.
- **규칙**:
  1. **새 Supabase Storage 버킷 생성 시 반드시 4개 정책을 모두 검토**: SELECT / INSERT / UPDATE / DELETE. 대시보드 기본 템플릿은 쓰지 말고 SQL로 명시 작성.
  2. **INSERT/UPDATE/DELETE 정책에는 항상 경로 스코프 체크**: `(storage.foldername(name))[1] = <user 또는 tenant ID>`. 버킷만 공유하고 경로는 isolate하는 것이 표준 패턴.
  3. **버킷 생성 직후 penetration 테스트**: `curl`이나 Supabase 대시보드 "Insert" 버튼으로 **다른 사용자의 경로**에 업로드 시도 → RLS가 차단해야 함. 실패하면 정책을 고칠 것.
  4. **`bucket_id` 체크만 있는 정책 = 사실상 방어 없음**: `bucket_id`는 RLS 전에 이미 결정되는 값이라 조건이 아님. 다른 조건 (`auth.uid()`, `foldername(name)`, `(metadata->>'owner')::uuid`)을 반드시 조합.
  5. **정책 네이밍 규칙**: `<주체>_<동작>_<자원>` 형식 권장. 예: `shop_owners_upload_product_images`. 기본 템플릿의 `Users can upload X` 같은 문장형 이름은 애매하고 검색하기 어려움.
  6. **이 규칙은 Storage 뿐만 아니라 모든 RLS에 일반화**: DB 테이블 RLS도 "Authenticated users can SELECT"만 걸어두면 공유 DB에서 tenant isolation이 뚫림. Session #4의 V1 DROP 사고와 같은 뿌리 — **공유 자원 + 느슨한 정책 = 재앙**.

### 2026-04-06 — [Architecture] Next.js App Router 3-레이어 방어 — middleware / layout / Server Action 역할 분리
- **증상**: Task 1-7.5 구현 후 Task 3에서 `products/new/page.tsx`의 인증+shop 쿼리가 `(dashboard)/layout.tsx`와 중복됨을 발견. "어디서 방어해야 하는가?"라는 질문이 반복되고 있음. Session #7 "쿠키 캐싱은 보안 경계 아님" 교훈과 Session #11 "Server Action은 브라우저 직접 호출 가능" 규칙이 연결됨을 깨달음.
- **원인**: Next.js 15/16 App Router는 3개의 서로 다른 방어 계층을 제공하는데, 각각의 역할이 다르고 혼동되기 쉬움:
  1. **Middleware**: 모든 요청을 가로챔 (Edge Runtime). 빠른 리다이렉트/라우팅 전용. 쿠키 기반 캐싱이 가능하지만 **쿠키는 클라이언트가 조작 가능**하므로 보안 판단 근거로 쓰면 안 됨 (Session #7 교훈).
  2. **Layout (Server Component)**: 라우트 트리의 특정 segment 아래 모든 페이지 진입 전에 실행. DB 쿼리로 실제 사용자 상태 검증 가능. 실패 시 `redirect()`로 하위 page 렌더 자체를 차단. **진짜 보안 경계**.
  3. **Server Action**: 페이지와 무관하게 브라우저에서 직접 `fetch` 호출 가능. layout 방어를 우회할 수 있음. **최종 검증의 책임**.
  개발자가 이 차이를 모르고 "layout에서 검증했으니 Server Action에서는 생략"하거나 반대로 "Server Action에서 하니까 layout은 불필요"하게 되면 보안 공백 발생.
- **해결**: 3-레이어의 역할을 명시적으로 정의:
  | 레이어 | 목적 | 실패 대응 | 신뢰할 수 있는가? |
  |---|---|---|---|
  | **Middleware** | 라우팅 최적화, UX 리다이렉트 | redirect | ❌ 쿠키 기반 = 우회 가능 |
  | **Layout** | 진짜 보안 경계, 페이지 진입 차단 | redirect | ✅ 서버 DB 검증 |
  | **Server Action** | 실제 데이터 변경의 최종 검증 | 에러 반환 | ✅ 매 요청 자체 검증 |

  Task 3에서 `products/new/page.tsx`의 중복 쿼리는 layout이 이미 처리했으므로 제거. 하지만 `createProduct` / `createProductWithImages` / `createProductsBulk` Server Action의 `auth.getUser` + `shops` 조회는 **의도적으로 유지**. 코드에 레이어링 의도를 JSDoc으로 명시:
  ```tsx
  /**
   * 인증/온보딩/shop 검증은 상위 `(dashboard)/layout.tsx`에서 매 요청마다 수행된다.
   * 이 페이지가 렌더된다는 것은 이미 다음이 보장된 상태...
   *
   * 주의: Server Action은 브라우저에서 직접 호출 가능하므로 각자 스스로 재검증한다.
   * 이 레이어 분리는 의도된 것 — layout 방어를 Server Action에서 신뢰하지 말 것.
   */
  ```
- **규칙**:
  1. **Page (Server Component)는 layout의 방어를 신뢰해도 된다**: Next.js App Router에서 layout이 page보다 먼저 실행되고 `redirect()`가 하위 렌더를 차단하는 것은 프레임워크 불변식. 같은 검증을 page에서 반복하면 DB 왕복 낭비 + 코드 부패.
  2. **Server Action은 layout의 방어를 신뢰하면 안 된다**: Server Action은 페이지 URL과 무관하게 `<form action={myAction}>` 또는 `fetch`로 호출 가능. layout은 돌지 않음. 매 Server Action 시작에 `auth.getUser()` + 소유권 검증 블록이 있어야 함.
  3. **Middleware는 UX 전용**: `onboarding_done` 같은 쿠키 기반 캐싱은 빠른 리다이렉트 UX로만 쓰고, 실제 권한 판단은 layout + Server Action에서. "미들웨어에서 막았으니 안전"은 위험한 사고방식.
  4. **코드 리뷰에서 "중복 같은데?" 지적 시 레이어 확인**: 같은 검증 코드가 layout과 page에 동시 있으면 **page쪽은 제거**. 같은 검증이 layout과 Server Action에 있으면 **둘 다 유지**. 구조적 의미가 다름.
  5. **경계 문서화 필수**: 프로젝트마다 "어디서 무엇을 검증하는가" 레이어 다이어그램을 `docs/ARCHITECTURE.md` 또는 JSDoc 주석으로 남길 것. 다음 세션/개발자가 같은 함정을 반복하지 않도록.
  6. **Session #7 + Session #11 통합 교훈**: "쿠키 ≠ 보안 경계" + "Server Action ≠ layout 신뢰"는 같은 원칙의 두 얼굴 — **공격자가 통과할 수 있는 경로마다 독립적 검증이 필요**. 신뢰 경계를 잘못 그으면 한 경로가 뚫릴 때 전체가 뚫림.

### 2026-04-05 — [AI-Pitfall] shadcn/ui init이 디자인 시스템 CSS 변수 덮어쓰기
- **증상**: `npx shadcn@latest init` 실행 후 `--primary`, `--secondary` 등이 oklch 값으로 교체됨
- **원인**: shadcn이 globals.css의 `:root`와 `.dark` 블록에 자체 변수를 주입
- **해결**: shadcn 변수를 Chatsio 디자인 토큰으로 재매핑 (`--background: var(--surface)` 등)
- **규칙**: shadcn init 후 반드시 globals.css 검증. `oklch` 검색 → 디자인 토큰으로 교체. shadcn 호환 변수는 `var(--our-token)` 형태로 매핑.
