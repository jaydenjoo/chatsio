# Chatsio Progress Journal

> 매 세션 시작 시 이 파일부터 업데이트.
> **프로젝트 경로**: `/Users/jayden/projects/chatsio/` (Session #10에서 `/Volumes/jayden-ssd/chatsio`에서 이동 — 아래 "프로젝트 이동" 섹션 참조)

## 현재 위치
- Epic: Phase 2 진입 전 정리 (Phase 1 완료 후)
- Task: **루트 `/` 랜딩 placeholder** (구현 완료, 커밋 대기 중) + **프로젝트 경로 이동** (완료)
- 상태: 구현 완료 / 검증 통과 / **커밋 + 원본 삭제 결정 대기**

## ⚠️ 프로젝트 이동 (Session #10) — CRITICAL

Session #10에서 Turbopack × exFAT 비호환 이슈로 프로젝트 **전체를 내장 SSD(APFS)로 이동**:

| 항목 | Before | After |
|---|---|---|
| 경로 | `/Volumes/jayden-ssd/chatsio` | **`/Users/jayden/projects/chatsio`** |
| 파일시스템 | exFAT (외장) | APFS (내장) |
| Turbopack | ❌ LevelDB persistence 에러 | ✅ `Ready in 248ms` |
| AppleDouble (`._*`) | 자동 생성 (쓰레기) | 생성 안 됨 (clean) |
| Claude 메모리 | `-Volumes-jayden-ssd-chatsio/` | `-Users-jayden-projects-chatsio/` |

**원본 상태**: `/Volumes/jayden-ssd/chatsio`는 **그대로 보존**. Jayden이 검증 후 "삭제 OK" 지시 시 제거.

**이후 작업 방법**: 새 Claude Code 세션을 `cd /Users/jayden/projects/chatsio` 후 `claude`로 시작하면 새 경로 기준으로 CLAUDE.md / 메모리 / PROGRESS.md 자동 로드.

## 이번 세션 완료 내역 (Session #10)

### 1. 루트 `/` 랜딩 placeholder 구현 (Phase 2 진입 전 정리)
- **계획 단계**: 스코프 협상 4회 (헤드라인 / CTA1 / CTA2 / 로고 컨셉)
  - 헤드라인: "쇼핑몰 상품을 AI가 읽을 수 있게." (부드러움)
  - CTA1: "지금 시작 →" / CTA2: "로그인"
  - 로고: 모노그램 "C" SVG (컨셉 A)
  - **Not Doing**: 풀 랜딩 섹션(Task 3-3 정식 작업), Pricing, 마케팅 카피 — placeholder 스코프 유지
- **신규 파일**:
  - `src/components/brand/logo.tsx` — 모노그램 SVG 컴포넌트 (size prop, `--primary`/`--on-primary` 토큰 직접 `style` 주입, 라이트/다크 자동 전환, `aria-label="Chatsio"`)
- **전체 재작성**:
  - `src/app/(public)/page.tsx` — Next.js 기본 스캐폴딩 완전 제거, Server Component로 재구현
    - 상단 Nav: Logo + 로그인 링크
    - Hero: Beta 뱃지 / 2줄 헤드라인 (두 번째 줄 `--primary` 강조) / 서브카피 / CTA pair
    - Footer: © 2026 Chatsio · 상품 데이터 인프라
    - 디자인 시스템: 배경 도트 텍스처, 2레이어 그림자(CTA primary), `font-display` (DM Sans), 호버 translateY + shadow 강화, focus-visible ring
    - metadata export (title + description)
- **검증**: typecheck ✅ / lint ✅ (pre-existing warning 1개 무관) / build ✅ / Turbopack dev `Ready in 248ms` ✅ / curl HTTP 200 + 제목/헤드라인/CTA/Logo SVG 확인 ✅

### 2. 환경 크리티컬 이슈 발견 + 해결
- **증상**: Task 구현 후 `pnpm dev`가 `Failed to open database / Loading persistence directory failed / invalid digit found in string` 에러로 시작 실패. build는 통과.
- **디버깅 여정**:
  1. `.next` 삭제 시도 → 같은 에러 재발
  2. 파일시스템 확인 → `/Volumes/jayden-ssd`가 **exFAT**임을 발견
  3. `.next/dev/cache/turbopack/*/`에 LevelDB `.sst`, `CURRENT`, `LOG` 파일 존재 확인
  4. macOS가 exFAT에서 xattr 저장 못 해서 `._*` AppleDouble 자동 생성 → LevelDB 스캐너가 `._*.sst`를 진짜 파일로 오인 → 매직 바이트 파싱 실패
  5. 임시 우회: webpack dev로 시도 → 성공 (그러나 Turbopack 포기)
- **근본 해결**: 프로젝트를 내장 SSD(APFS)로 이동
  - `rsync -a --exclude=node_modules --exclude=.next --exclude='._*' ...` — 764개 파일, 26MB, 1초 미만
  - Claude Code 메모리 디렉토리 복사 (`-Volumes-jayden-ssd-chatsio` → `-Users-jayden-projects-chatsio`, 3개 파일 보존)
  - `pnpm install` 3.4초 (pnpm store 링크)
  - Turbopack dev 정상 작동 확인

### 3. 교훈 기록 (learnings.md에 2건 추가)
- `[Environment/Critical] Turbopack LevelDB × exFAT 외장 SSD 비호환`
- `[Process] macOS 프로젝트 이동 템플릿 (rsync + 메모리 + pnpm + 검증)`

## 다음 세션 할 일

1. **새 Claude Code 세션을 `/Users/jayden/projects/chatsio`에서 시작** (CLAUDE.md / 메모리 / PROGRESS.md 새 경로 기준 로드)
2. **랜딩 코드 커밋** — `src/app/(public)/page.tsx` + `src/components/brand/logo.tsx`
   - 제안 메시지: `feat: 루트 / 랜딩 placeholder — 모노그램 로고 + Hero + CTA (Task 3-3 정식 랜딩 전 임시)`
   - Jayden 최종 확인 후 커밋
3. **원본 `/Volumes/jayden-ssd/chatsio` 삭제 결정** — 새 경로에서 며칠 작업하며 안정성 확인 후 Jayden 판단
4. **Phase 2 진입 전 정리 Task 묶음**:
   - Task 1-7.5 이미지 업로드 (Supabase Storage 버킷 + RLS + Server Action, ~1h)
   - L1 리팩토링: `products/new/page.tsx` 중복 인증/shop 쿼리 제거
   - M3 리팩토링: `header.tsx` reduce mutation 제거
5. **Phase 2: AI 구조화 파이프라인** (n8n webhook → Claude API → JSON-LD + 네이버EP)
6. **다른 프로젝트(Findably, afg) 이동 전략 결정** — 같은 exFAT × Turbopack 이슈 재발 가능성

## 차단 요소
- **원본 경로 삭제 결정 대기** (Jayden 확인 필요)
- Google Cloud Console OAuth 설정 (Phase 1부터 이월된 외부 의존)
- DB 직접 연결(DATABASE_URL) 불가 — Supabase MCP 사용 중

## QA 결과 (Session #9 말미)
Playwright MCP로 public 페이지 (`/login`, `/signup`, `/`) 다크모드 동작 검증:
- ✅ `.dark` 클래스 `<html>` 주입 정상 (next-themes)
- ✅ `color-scheme: dark` 적용 (브라우저 네이티브 UI 다크 전환)
- ✅ body 배경 토큰 `rgb(14, 20, 25)` 정상
- ✅ `localStorage` 저장 + 새로고침 유지
- ✅ 라이트/다크 전환 시 Pretendard 폰트, 폼 필드, 버튼, 글래스모피즘 카드 모두 가독성 OK
- ⏳ Header ThemeToggle 실제 클릭 동작 / Sun↔Moon 아이콘 스왑 / aria-pressed / focus-visible ring — **로그인 필요**로 수동 확인 필요
- 🔴 **QA 중 pre-existing 버그 발견 → 즉시 hotfix**: globals.css CDN `@import` 위치 → Turbopack dev 500 에러
- 🟡 **QA 중 스코프 밖 이슈 발견**: 루트 `/` 페이지가 Next.js 기본 스캐폴딩 상태 (page.tsx 미구현, 깨진 SVG). **별도 Task 필요**

## 이번 세션 완료 내역 (Session #9)
- **Task 1-10**: 다크모드 토글 (예상 35~55m → 실소요 ~50m)
  - `next-themes@0.4.6` 도입 (attribute="class" + system 추적)
  - `ThemeProvider` 얇은 래퍼 (Client Component) 신규 + RootLayout wrap
  - `RootLayout`에 `suppressHydrationWarning` 추가
  - `ThemeToggle` 신규 — CSS-only 아이콘 스왑 (`dark:hidden` / `hidden dark:block`)
    - **React 19 `react-hooks/set-state-in-effect` 린터 규칙 회피**
    - mounted flag + setState-in-effect 안티패턴 제거
  - Header Moon 버튼 → `<ThemeToggle />` 교체 (스타일 보존)
  - `disableTransitionOnChange` 활성 — 토글 시 색상 깜빡임 방지
- **Task 1-10 리뷰 사이클**:
  - code-reviewer 단독 (🟢 등급, security-reviewer 생략)
  - HIGH 1 + MEDIUM 3 + LOW 3 발견
  - 내 변경 관련 4건 즉시 수정:
    - **H1 aria-label 정적 → aria-pressed 동적화** (SSR/CSR 첫 렌더 모두 `undefined === "dark"` → `false`로 일치, hydration mismatch 없음)
    - **M2 `handleToggle` `resolvedTheme` undefined 가드** (하이드레이션 직후 짧은 창에 OS 선호와 반대 방향 토글 방지)
    - **M4 `title` 속성 제거** (`aria-label`과 중복 안내 방지)
    - **L5 `focus-visible` ring 추가** (WCAG 2.4.7, `--ring` 토큰)
  - 스코프 밖 3건 보류:
    - M3 `header.tsx` reduce mutation (pre-existing, Session #6 NAV 추출 시 추가됨)
    - L6 `ReactElement` 타입 너비 (사소한 스타일, 빌드 통과)
    - L7 `globals.css .dark body::before` (pre-existing)
- **총 커밋 1건**: c7b1e89 (feat: Task 1-10 다크모드 토글 + 리뷰 4건 수정)
- **변경 통계**: 6파일, +90/-9 (2 신규 + 4 수정 + 1 패키지 추가)

## 세션 #8 완료 내역 (직전 세션)
- **Task 1-8**: CSV 벌크 상품 등록 (예상 1.5~2h → 실소요 ~2h)
- **Task 1-8**: CSV 벌크 상품 등록 (예상 1.5~2h → 실소요 ~2h)
  - `papaparse` 도입 (클라이언트 CSV 파싱)
  - `validation.ts` 신규 — `BULK_MAX_ROWS/NAME/URL` + `hasFormulaInjection()` 서버/클라이언트 공유
  - `createProductsBulk` Server Action — Zod 이중 검증(배열 길이 → 행별) + 단일 배열 insert
  - `CsvUploadForm` Client Component — 3 Phase 흐름(idle → preview → result) + 드래그앤드롭
  - `ProductCreateForm` CSV 탭 활성화 + 인라인 style 제거
  - `public/templates/products-sample.csv` 샘플 제공
- **Task 1-8 리뷰 사이클**:
  - code-reviewer + security-reviewer 병렬 리뷰 → HIGH 5 + MEDIUM 5 발견
  - 전부 즉시 수정 후 2차 커밋 없이 단일 커밋으로 landing
  - 주요 수정:
    - **H1 Formula injection 유니코드 우회**: NFKC 정규화 + NBSP/BOM leading strip (full-width `＝`, `\u00A0=HYPERLINK(...)` 차단)
    - **H2 DB DoS 표면 축소**: 개별 insert 100회 루프 → 단일 배열 insert 1회
    - **H3 0-success UX**: `successCount === 0` 시 빨강 XCircle + "등록 실패" 분기
    - **H4 상수 중복 제거**: `validation.ts` 단일 소스 import
    - **H5 드래그앤드롭 실구현**: `onDragEnter/Over/Leave/Drop` + 시각 피드백
    - M1~M5: exhaustive throw, 인라인 style 제거, 코멘트 일치, isRecord 타입가드, 에러 한국어화
- **총 커밋 1건**: cfac951 (feat: Task 1-8 CSV 벌크 상품 등록 + 리뷰 10건 수정)
- **변경 통계**: 8파일, +801/-16 (3 신규 + 5 수정)

## 세션 #7 완료 내역
- **Task 1-7**: 상품 등록 페이지 (URL 입력)
  - `createProduct` Server Action (Zod + http/https 스킴 화이트리스트 + IDOR 방어)
  - `/products/new` 페이지 (Server Component, 인증 + shop 검증)
  - `ProductCreateForm` Client Component (3탭 Segmented Control — URL 활성, 이미지/CSV Soon)
  - loading.tsx + error.tsx + metadata export
  - 코드 리뷰 6개 MEDIUM 즉시 수정 (URL 스킴 화이트리스트, router.refresh 제거, dead code 제거, metadata, barrel import, setError fallback)
- **Task 1-7.1**: 보안 강화 (Task 1-7 리뷰에서 발견된 2건)
  - `(dashboard)/layout.tsx` → async Server Component로 전환, 매 요청 DB 검증 (user_profiles + shops)
  - 미들웨어 `onboarding_done` 쿠키 조작 우회 차단 (쿠키 캐싱은 UX 용도로 유지)
  - `getProducts` `.or()` PostgREST injection 방어 (LIKE 와일드카드 이스케이프 + `,` 제거)
- **Task 1-7.1 follow-up**: 리뷰 후속 수정 2건
  - PostgREST 구분자 처리 완화 — `(` `)` `.` 보존 (한국 상품명 UX)
  - layout.tsx getUser/profile/shop 에러 분리 로깅
- **총 커밋 3건**: 3faa882 → ac70734 → 8bb28d8
- **변경 통계**: 7파일, +534/-6

## 세션 #6 초반 완료 내역
- Task 1-9: 레이아웃 (Sidebar + Header + 반응형)
  - Sidebar (260px 고정, 네비게이션 2그룹, 사용자 Footer)
  - Header (Glassmorphism, 브레드크럼, 다크모드/알림 placeholder)
  - MobileSidebar (Sheet 기반, 768px 이하)
  - DashboardShell (Server Component layout + Client Shell 분리)
  - NAV 상수 추출 (`constants/nav.ts`), SidebarUserFooter 컴포넌트 분리
- 전체 코드 리뷰 (Phase 0 + Task 1-1~1-5 + Task 1-9)
  - 3개 병렬 리뷰 에이전트 실행 → 총 25개 이슈 발견
- 코드 리뷰 이슈 21개 수정 (CRITICAL 5 + HIGH 8 + MEDIUM+LOW 8)
  - C1: auth actions Zod 검증 추가
  - C2: OAuth callback open redirect 방지
  - C3: Supabase 에러 메시지 안전 매핑
  - C4: /api/* 인증 우회 → 화이트리스트 방식
  - C5: addFirstProduct IDOR 방지 (shopId 소유권 검증)
  - H1: 미들웨어 onboarding DB 쿼리 → 쿠키 캐싱
  - H2: OAuth origin fallback 체인
  - H3: useUser getUser() 에러 처리
  - H4: Geist 폰트 제거 (디자인 시스템 충돌)
  - H5: Supabase 브라우저 클라이언트 싱글턴
  - H6: API 응답 success 필드 + meta 키 통일
  - H7: error.tsx 내부 에러 노출 제거
  - H8: 온보딩 뒤로가기 shopId 초기화
  - M1-M8, L1-L4: 반환 타입, utils, login UX, products placeholder 등

## 다음 세션 할 일 (Phase 2 시작 전 정리)
1. **Jayden 직접 대시보드 다크모드 QA** (로그인 후, ~5m)
   - Header 우상단 ThemeToggle 클릭 → Sun↔Moon 스왑 확인
   - Tab 키로 포커스 → 파란 ring 확인
   - Sidebar/Card/Table 다크 토큰 가독성 확인
   - 반복 토글 시 트랜지션 깜빡임 없음 확인 (disableTransitionOnChange)
   - `/onboarding` 다크 확인 (신규 계정 또는 onboarding_completed=false)
2. **Phase 2 진입 전 정리 Task 묶음** (예상 1~1.5h):
   - **Task 1-7.5**: 이미지 업로드 (Supabase Storage 버킷 + RLS + Server Action, ~1h)
   - **L1 리팩토링**: `products/new/page.tsx` 중복 인증/shop 쿼리 제거 — layout 검증값을 Context/prop 전달 (20~30m)
   - **M3 리팩토링**: `header.tsx` reduce mutation 제거 (3줄, 5m)
   - **루트 `/` 랜딩 페이지 정리**: Next.js 기본 스캐폴딩(page.tsx + SVG) 제거 또는 실제 랜딩 구현 (Phase 2 전후 어느 쪽이든)
3. **Phase 2: AI 구조화 파이프라인** — PRD 재검토 후 Task 분해
   - n8n webhook → Claude API → JSON-LD + 네이버EP 생성
   - `extraction_jobs` 테이블 + 상태 전이 (queued/processing/completed/failed)
   - Cafe24 API 우선 vs OCR fallback 분기
4. Google Cloud Console에서 OAuth 클라이언트 ID 생성 → Supabase에 등록 (Phase 1 외부 의존)
5. M3 (inline style → Tailwind 클래스) 미수정 — 온보딩 steps 파일들 (Phase 2 중 편의에 따라)

## 수동 QA 미검증 (Jayden 확인 필요)
### Task 1-7 (이전 세션)
- [ ] `/products/new` 정상 등록 → `/products` 반영
- [ ] `javascript:` URL 입력 → 화이트리스트 에러
- [ ] 쿠키 조작 (`document.cookie = "onboarding_done=1"`) → 여전히 `/onboarding` 리다이렉트
- [ ] 검색 `"나이키(운동화)"`, `"ABC Co."` → 괄호/마침표 보존
- [ ] 검색 `"test,status.neq.optimized"` → 쉼표만 제거

### Task 1-10 (이번 세션)
- [ ] Header 우상단 Moon 버튼 클릭 → 다크 전환 (페이지 전체 토큰 반영)
- [ ] 다시 클릭 → 라이트 복귀 (Sun → Moon 아이콘 스왑 확인)
- [ ] 새로고침 시 선택한 테마 유지 (localStorage)
- [ ] 새로고침 시 깜빡임(FOUC) 없음 (next-themes 스크립트 주입 확인)
- [ ] OS 다크모드 토글 → 수동 선택 안 한 상태면 자동 반영 (defaultTheme=system)
- [ ] Sidebar/Header/Card/Table/Form 모든 컴포넌트 가독성 OK (모든 페이지 순회)
- [ ] 특히 `/products`, `/onboarding`, `/login` 3페이지 최소 확인
- [ ] Tab 키로 토글 버튼 포커스 → 파란 ring 표시 (focus-visible)
- [ ] 스크린리더로 토글 버튼 포커스 → "다크 모드 토글, 토글 버튼, 눌림/눌리지 않음" 안내
- [ ] 라이트 → 다크 → 라이트 반복 토글 시 트랜지션 깜빡임 없음 (disableTransitionOnChange)

### Task 1-8 (직전 세션)
- [ ] `/products/new` → CSV 탭 → 샘플 다운로드 → 3건 업로드 → `/products` 반영
- [ ] 드래그앤드롭 동작 (드롭존에 파일 떨어뜨리기, 드래그 중 시각 피드백)
- [ ] 100행 초과 CSV → 상한 안내 에러
- [ ] 1MB 초과 파일 → 상한 안내 에러
- [ ] `.txt` 파일 업로드 → 거부
- [ ] Formula injection:
  - `=cmd|'/c calc'!A1` → 거부 (기본)
  - `＝SUM(A1)` full-width → 거부 (NFKC 정규화)
  - `\u00A0=HYPERLINK(...)` NBSP + = → 거부 (leading WS strip)
- [ ] 모든 행 URL 잘못된 CSV → 빨강 "등록 실패" 화면 (0-success 분기)
- [ ] 헤더 누락 CSV → "name, url 컬럼 필요" 에러

## 차단 요소
- Google Cloud Console OAuth 설정 필요 (구글 로그인 실제 동작용)
- DB 직접 연결(DATABASE_URL) 불가 — Supabase MCP로 마이그레이션 실행 중

## 🚫 DB 작업 경계 (CRITICAL)
- Supabase 프로젝트 `chatsio-v1`(souqwsdwabhqbbvpwfpe)은 Chatsio + Findably 공유
- Chatsio 허용 테이블: user_profiles, shops, products, optimizations, prompts, prompt_versions
- Findably 테이블 (작업 금지): profiles, diagnoses, diagnosis_items, payments, reports, gift_codes, gift_code_uses, analytics_events
- 원칙: "내가 만든 것만 건드린다". Findably는 진행 중이라 신규 마이그레이션이 계속 추가됨
- 메모리 영구 저장: ~/.claude/projects/-Volumes-jayden-ssd-chatsio/memory/findably_db_boundary.md

## 산출물 위치
- CEO 플랜: ~/.gstack/projects/garrytan-gstack/ceo-plans/2026-04-05-chatsio-ai-visibility.md
- 디자인 문서: ~/.gstack/projects/garrytan-gstack/jayden-main-design-20260405-204300.md
- 테스트 플랜: ~/.gstack/projects/garrytan-gstack/jayden-main-eng-review-test-plan-20260405-214401.md
- PRD: /Volumes/jayden-ssd/chatsio/docs/PRD.md
- 디자인 에셋: /Volumes/jayden-ssd/chatsio/docs/design-references/stitch-code/

## 마지막 업데이트
- 날짜: 2026-04-06 (세션 10 — 랜딩 placeholder 구현 + **exFAT × Turbopack 비호환 발견 + 프로젝트 내장 SSD 이동**)

---

## Session Log

### 2026-04-06 Session #10 — 랜딩 placeholder + 프로젝트 경로 이동
- **Goal**: 루트 `/` Next.js 기본 스캐폴딩 정리 (Phase 2 진입 전 첫인상 정돈)
- **Completed**:
  - 루트 `/` 랜딩 placeholder 구현
    - `Logo` 컴포넌트 신규 (모노그램 "C" SVG, 디자인 토큰 직접 사용)
    - `(public)/page.tsx` 전체 재작성 (Nav + Hero + Footer, Server Component, 디자인 시스템 v3.0 토큰)
    - metadata export
  - 검증: typecheck + lint + build + Turbopack dev + curl HTTP 200 모두 통과
  - **환경 크리티컬 이슈 발견 + 해결**: Turbopack LevelDB persistence가 exFAT 외장 SSD의 `._*` AppleDouble 파일 때문에 DB 로드 실패
  - **프로젝트 전체 이동**: `/Volumes/jayden-ssd/chatsio` → `/Users/jayden/projects/chatsio` (APFS)
    - rsync 764개 파일 26MB (node_modules/.next/`._*` 제외)
    - Claude Code 메모리 디렉토리 복사
    - pnpm install 3.4초 (store 링크)
    - Turbopack 정상 작동 확인 (`Ready in 248ms`)
  - learnings.md 교훈 2건 추가 (exFAT × Turbopack 비호환, 프로젝트 이동 템플릿)
- **Status**: 구현 완료, **랜딩 코드 커밋 + 원본 삭제 결정 대기**
- **Blockers**: 원본 `/Volumes/jayden-ssd/chatsio` 삭제 결정 필요
- **Next**: 새 세션을 새 경로에서 시작 → 랜딩 커밋 → Phase 2 진입 전 정리 Task (1-7.5 이미지 업로드, L1/M3 리팩토링)

### 2026-04-05 Session #1 — Initial Setup (cc-init-next)
- **Goal**: 프로젝트 초기 설정
- **Status**: Complete
- **Blockers**: None
- **Next**: PRD 검증

### 2026-04-05 Session #2 — CEO+Eng Review + 프로젝트 세팅
- **Goal**: PRD 검증 (CEO+Eng) + 기술검증 + 프로젝트 초기화 완료
- **Status**: Complete
- **Blockers**: None
- **Next**: Phase 0 개발 시작

### 2026-04-05 Session #3 — Phase 0 완료
- **Goal**: Phase 0 전체 구현 (Task 0-2 ~ 0-10)
- **Completed**:
  - Task 0-2: 디자인 시스템 v3.0 토큰 (Light/Dark, 44개 색상, 그림자, 타이포)
  - Task 0-7: 모듈형 폴더 구조 (src/ 마이그레이션, 3개 라우트 그룹, 17개 페이지)
  - Task 0-3: Supabase 연결 (3종 클라이언트 + Zod 환경변수 검증)
  - Task 0-4: Drizzle ORM 설정 (스키마 구조 준비)
  - Task 0-8: V2 DB 스키마 설계 (6개 테이블 + RLS + Auth Trigger)
  - Task 0-9: API Route 표준 구조 (응답/에러 포맷 + 5개 엔드포인트)
  - Task 0-10: shadcn/ui + 공통 컴포넌트 4개 (KPICard, StatusBadge, EmptyState, PageHeader)
- **Status**: Complete
- **Blockers**: .env.local에 DATABASE_URL 미입력
- **Next**: Phase 1 (인증 + 상품 관리)

### 2026-04-05~06 Session #4 — DB 구축 + Phase 1 인증
- **Goal**: V2 DB 테이블 생성 + Phase 1 인증 기반 (Task 1-1~1-4)
- **Completed**:
  - V1 테이블 전체 DROP + V2 6개 테이블 생성 (Supabase MCP)
  - V2 RLS 정책 + Auth Trigger 적용
  - Task 1-1: Supabase Auth (미들웨어 세션, Server Actions, useUser 훅)
  - Task 1-2: 로그인/회원가입 페이지 (2분할 Auth 레이아웃)
  - Task 1-3: 구글 소셜 로그인 (signInWithGoogle, OAuth 콜백)
  - Task 1-4: 미들웨어 인증 가드 (보호/공개 라우트 분기)
- **Status**: Complete
- **Blockers**: Google Cloud Console OAuth 설정 필요 (구글 로그인 실제 동작용)
- **Next**: Task 1-5 (온보딩 위저드)

### 2026-04-06 Session #5 — Task 1-5 온보딩 위저드
- **Goal**: 온보딩 4단계 위저드 구현
- **Completed**:
  - Task 1-5: 온보딩 위저드 (Welcome → ShopInfo → FirstProduct → Complete)
  - Server Actions 3개 (createShop, addFirstProduct, completeOnboarding)
  - Zod 검증 (쇼핑몰 이름/URL, 플랫폼/업종 enum)
  - 미들웨어 온보딩 리다이렉트 (onboarding_completed === false → /onboarding)
  - 프로그레스 바 + 디자인 시스템 토큰 적용
- **Status**: Complete
- **Blockers**: Google Cloud Console OAuth 설정 필요 (구글 로그인 실제 동작용)
- **Next**: Task 1-9 (레이아웃 Sidebar + Header)

### 2026-04-06 Session #6 — Task 1-9 + 코드 리뷰 + Task 1-6 + DB 경계
- **Goal**: 레이아웃 + 누적 코드 리뷰 + 상품 목록 + DB 경계 설정
- **Completed**:
  - Task 1-9: Sidebar + Header + MobileSidebar + DashboardShell (반응형)
  - 전체 코드 리뷰 3영역 병렬 실행 (Phase 0, 인증 1-1~1-4, 온보딩 1-5)
  - 25개 이슈 발견 → 21개 수정 (CRITICAL 5, HIGH 8, MEDIUM+LOW 8)
    - 보안: Zod 검증, Open Redirect, IDOR, 에러 노출, API 인증 우회
    - 성능: 미들웨어 onboarding 쿠키 캐싱, Supabase 클라이언트 싱글턴
    - 아키텍처: Server/Client Component 분리, NAV 상수 추출, enum 단일 소스
  - Task 1-6: 상품 목록 페이지
    - Server Actions (getProducts, deleteProduct) + 소유권 검증
    - UI 3개 (SearchBar, Table, EmptyState) + page.tsx + loading + error
    - 검색/필터/정렬/페이지네이션/KPI Bento 그리드
  - DB 경계 확립: Chatsio + Findably 공유 프로젝트 확인 → "내가 만든 것만 건드린다" 규칙
- **Status**: Complete
- **Blockers**: Google Cloud Console OAuth 설정 필요
- **Next**: Task 1-7 (상품 등록)

### 2026-04-06 Session #9 — Task 1-10 다크모드 토글 → Phase 1 완료
- **Goal**: Phase 1의 마지막 Task — 다크모드 토글 구현 + Phase 1 클로저
- **Completed**:
  - Task 1-10: 다크모드 토글
    - `next-themes@0.4.6` 도입 (attribute="class" + defaultTheme="system" + disableTransitionOnChange)
    - ThemeProvider 얇은 래퍼 + RootLayout wrap + suppressHydrationWarning
    - ThemeToggle CSS-only 아이콘 스왑 (`dark:hidden` / `hidden dark:block`)
    - Header Moon 버튼 → <ThemeToggle /> 교체
  - 리뷰 사이클 (code-reviewer 단독, 🟢 등급) → HIGH 1 + MEDIUM 3 + LOW 3
    - H1 aria-label 정적 → aria-pressed 동적화 (SSR 안전)
    - M2 handleToggle undefined 가드
    - M4 title 중복 제거
    - L5 focus-visible ring (WCAG 2.4.7)
    - 보류 3건: M3(pre-existing header mutation), L6(ReactElement 타입), L7(pre-existing globals)
  - **React 19 린터 함정 발견**: `react-hooks/set-state-in-effect` 규칙이 mounted flag 패턴을 금지. CSS-only variant로 우회.
  - **Phase 1 완료**: 1-1~1-10 전부 완료 (10/10)
- **Status**: Complete — Phase 1 CLOSED
- **Blockers**: Google Cloud Console OAuth 설정 필요 (Phase 1 외부 의존만 남음)
- **Next**: Phase 2 AI 구조화 파이프라인 진입 전 정리 Task(1-7.5 이미지 업로드 + L1/M3 리팩토링)

### 2026-04-06 Session #8 — Task 1-8 CSV 벌크 상품 등록
- **Goal**: CSV 파일로 상품 일괄 등록 (100행/1MB 상한)
- **Completed**:
  - Task 1-8: CSV 벌크 등록
    - papaparse 도입 (클라이언트 파싱)
    - validation.ts 신규 — 상한 + hasFormulaInjection 서버/클라이언트 공유
    - createProductsBulk Server Action (Zod 이중 검증 + 단일 배열 insert)
    - CsvUploadForm (idle → preview → result 3-Phase + 드래그앤드롭)
    - 샘플 CSV 제공 (/templates/products-sample.csv)
  - 리뷰 사이클 (code-reviewer + security-reviewer 병렬) → HIGH 5 + MEDIUM 5 즉시 수정
    - H1 Formula injection 유니코드 우회(NFKC + NBSP/BOM)
    - H2 DB 쿼리 100회 → 1회 (DoS 축소)
    - H3 0-success 실패 UI 분기
    - H4 상수 중복 제거 (validation.ts 단일 소스)
    - H5 드래그앤드롭 실구현
    - M1~M5: exhaustive throw, 인라인 style, 코멘트, 타입가드, 에러 한국어화
  - **`"use server"` 제약 발견**: 동기 함수 export 불가 → validation.ts 분리 패턴 확립
- **Status**: Complete
- **Blockers**: Google Cloud Console OAuth 설정 필요
- **Next**: Task 1-10 (다크모드) 또는 1-7.5 (이미지 업로드)

### 2026-04-06 Session #7 — Task 1-7 상품 등록 + 1-7.1 보안 강화
- **Goal**: 상품 등록 페이지 구현 + Task 내 리뷰 사이클 확립
- **Completed**:
  - Task 1-7: 상품 등록 페이지 (URL 입력)
    - createProduct Server Action + http/https 스킴 화이트리스트 + IDOR 방어
    - /products/new 페이지 + ProductCreateForm (3탭 Segmented Control)
    - loading.tsx + error.tsx + metadata export
  - Task 1-7 리뷰 (code-reviewer + security-reviewer 병렬) → 6개 MEDIUM 즉시 수정
  - Task 1-7.1 보안 강화: 리뷰에서 발견된 2건 수정
    - 미들웨어 쿠키 조작 우회 → `(dashboard)/layout.tsx`를 진짜 보안 경계로 전환
    - getProducts `.or()` PostgREST injection 방어
  - Task 1-7.1 리뷰 → 2건 MEDIUM follow-up 수정
    - 검색 UX 보존 (한국 상품명의 `(` `)` `.` 보존)
    - layout 에러 분리 로깅 (운영 안정성)
  - **리뷰 사이클 확립**: Task → 구현 → 리뷰 → 즉시 수정 → 커밋 → 다음 Task
    - Session #6처럼 25개 이슈 누적하지 않고 Task별 즉시 처리
- **Status**: Complete
- **Blockers**: Google Cloud Console OAuth 설정 필요
- **Next**: Task 1-8 (CSV 벌크) 또는 1-10 (다크모드)
