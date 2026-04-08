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

### 2026-04-08 — [Bug] Middleware matcher에 새 API prefix 제외 누락 → 내부 API가 307 `/login`으로 튕김
- **증상**: Task 2-M-B-2 구현 직후 E2E 검증(Playwright + curl)에서 발견. `POST /api/v1/internal/log-event`가 Bearer 토큰 검증 로직에 도달하지 못하고 `HTTP 307 → /login?next=/api/v1/internal/log-event`로 리다이렉트. n8n이 세션 쿠키 없이 호출하면 **엔드포인트가 runtime에 완전 무력화**
- **원인**: `src/middleware.ts`의 `config.matcher` negative lookahead에 `api/health`만 제외되어 있었고 `api/v1/internal` 제외가 없었음. middleware(`updateSession`)가 세션 쿠키 없는 요청을 `/login`으로 리다이렉트 → API 엔드포인트 자체는 실행조차 안 됨. 엔드포인트 내부의 Bearer 토큰 검증 + timing-safe 비교 + Zod 스키마가 전부 **도달 불가능한 코드**였음
- **해결**: `middleware.ts`의 matcher 정규식에 `api/v1/internal` 추가 — `/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/health|api/v1/internal).*)`. matcher 레벨 제외는 middleware 실행 자체를 건너뛰므로 (a) 성능 이득 + (b) 의도 명확("internal API는 Bearer로 자체 인증"). 주석으로 "Task 2-M-B-2 E2E 검증 중 발견"과 "새 내부 API도 이 prefix 아래에 둘 것" 컨벤션 명시
- **규칙**:
  1. **새 API 라우트를 만들 때 middleware matcher 확인 필수** — 특히 외부 서비스가 세션 쿠키 없이 호출하는 엔드포인트(Webhook, internal API, Bearer 토큰 API). matcher가 새 prefix를 가로채면 엔드포인트 내부 인증 로직 전부 무의미
  2. **내부 Bearer 토큰 API는 `/api/v1/internal/` prefix 아래에 둔다** — 일관된 예외 처리 가능. 향후 API 추가 시 matcher 재수정 불필요
  3. **tsc/lint/build + 코드 리뷰는 middleware-엔드포인트 경계 버그를 못 잡는다** — 전부 static 분석이라 runtime의 요청 라우팅을 확인 못 함. code-reviewer + security-reviewer 둘 다 API 파일만 보고 middleware 연계를 안 봄. **런타임 검증(curl 또는 Playwright)은 생략 불가**
  4. **보안 리뷰 요청 시 middleware 파일도 명시적으로 포함** — "이 API 엔드포인트 보안 리뷰해줘"라고 하면 리뷰어가 엔드포인트 파일만 본다. "middleware matcher + 이 API의 전체 요청 경로를 검증해줘"로 요청
  5. **E2E 검증은 Task 완료 선언 전에 반드시 실행** — Session #15 learnings의 "운영 검증은 실제 UI 경로까지 꼭 밟아야 한다"가 Session #18에서 **크리티컬 보안 버그**로 재확인됨. 커밋 직전 최소한 "secret 없이 curl → 401/500 중 어느 쪽인지" 확인만 해도 이 버그를 잡을 수 있었음
- **컨텍스트**: Session #18 Task 2-M-B-2. 최초 구현 + 2개 리뷰 + 검증 게이트 통과 후 **커밋까지 한 상태**에서 E2E 실행 시 발견. 만약 Jayden 요청이 없었다면 프로덕션 배포 후 n8n workflow가 "왜 이벤트가 하나도 안 쌓이지?" 상황에서 발견했을 가능성이 높음. 이 순서: **커밋 후 E2E 검증 → 버그 발견 → 별도 fix 커밋** 패턴은 최소한 "E2E가 존재한다"는 전제. E2E 없는 Task 완료는 앞으로 금지 수준으로 엄격 적용 필요

### 2026-04-08 — [Security] Bearer 토큰 상수 시간 비교 앞에 early return 분기 금지 — 타이밍 오라클
- **증상**: Task 2-M-B-2 `log-event API` 1차 구현에서 `if (providedToken.length === 0) return 401;` → `if (!constantTimeEquals(...)) return 401;` 두 분기를 두었음. security-reviewer가 HIGH로 지적
- **원인**: 빈 토큰 요청은 SHA-256 두 번 비용(수 μs)을 건너뛰고 즉시 401을 반환한다. 공격자가 빈 토큰 vs 1자 이상 토큰의 응답 시간을 대량 측정하면 이론적으로 분기를 판별 가능 → 상수 시간 비교를 도입한 *의도*와 불일치. 실전 exploit 난이도는 높지만 방어 일관성 파손
- **해결**: 빈 토큰 early return을 제거하고 `constantTimeEquals`가 항상 실행되도록 변경. SHA-256은 빈 문자열 입력도 32바이트 해시로 정규화하므로 분기별 타이밍 차이가 사라진다
- **규칙**:
  1. **상수 시간 비교 함수 진입 전 early return 금지** — 길이 체크, null 체크, format 체크 등 비교 자체를 건너뛰는 경로는 타이밍 오라클이 된다. "빈 값은 당연히 실패니까 바로 리턴하자"는 직관이 이 실수의 주된 원인
  2. 진입 전 검증이 꼭 필요하면 **dummy 비교로 타이밍 맞춤** (예: `timingSafeEqual(zero, zero)` 호출 후 false 리턴)
  3. **SHA-256 pre-hash 패턴**(`createHash("sha256").update(x).digest()` → `timingSafeEqual`)이 표준 관용구. 입력 길이를 32바이트로 정규화하여 길이 기반 타이밍 누출 + `timingSafeEqual`의 동일 길이 요구를 동시에 해결
  4. **Writer 단독 구현 금지** — 이 종류의 실수는 writer가 "더 안전하다"고 믿는 방향에서 발생. **security-reviewer 독립 리뷰가 잡아냄** → 🔴 프로젝트 인증/토큰 코드는 항상 `security-reviewer` 필수
- **컨텍스트**: Session #18 Task 2-M-B-2. code-reviewer는 지적 못 했고 security-reviewer만 잡음 → 두 리뷰어 병렬 실행의 가치. 만약 security-reviewer를 생략했다면 이 타이밍 오라클이 🔴 프로젝트에 남았을 것

### 2026-04-08 — [Architecture] 공용 validateBody 헬퍼를 보안 민감 엔드포인트에서 쓰려면 `ValidationResult` 확장으로 details leak 차단
- **증상**: Task 2-M-B-2 route.ts 초안에서 공용 `validateBody` 헬퍼 대신 `request.json()` + `safeParse`를 직접 구현. code-reviewer가 "기존 헬퍼 재사용" Should Fix
- **원인**: 공용 `validateBody`는 검증 실패 시 `ApiErrors.validationFailed(result.error.issues)`를 리턴하는데, 이 응답은 Zod issues를 `details` 필드로 포함하여 정보 누출. 🔴 보안 엔드포인트는 generic 400만 리턴해야 하므로 기본 응답을 그대로 쓸 수 없음. "헬퍼가 내 요구에 안 맞으니 직접 구현"이 자연스러운 선택처럼 보였지만 일관성을 깨뜨림
- **해결**: `ValidationResult` 타입을 확장 — `kind: "json_parse" | "schema"` + `issues?: readonly ZodIssue[]` 필드 추가. 보안 민감 호출자는 `validated.response`를 무시하고 자체 generic 400 응답을 리턴, `validated.issues`는 `console.error`에만 기록. 기존 호출자는 `{success: true, data}` 분기만 쓰므로 하위호환 완벽 유지
- **규칙**:
  1. **공용 헬퍼가 민감 컨텍스트에 맞지 않으면 포기 말고 확장**. 기존 시그니처에 새 필드만 추가하면 다른 호출자는 영향 없음
  2. **응답 생성과 에러 원인 식별을 분리** — 헬퍼가 "어떤 응답을 리턴할지"와 "어떤 실패 종류인지"를 동시에 제공하면 호출자가 응답만 덮어쓰고 원인은 로깅할 수 있다
  3. 헬퍼 확장 시 **기존 호출자도 함께 새 필드 채워야 함** — `validateQuery`에 kind 추가를 빼먹었다가 typecheck가 잡아냄 (다행). TypeScript strict가 이런 누락을 잡는 안전망
  4. **코드 중복 제거 vs 보안 요구** 트레이드오프에서 "중복을 감수한다"는 단기 해결은 일관성 부채가 됨. 헬퍼 확장이 정답
- **컨텍스트**: Session #18 Task 2-M-B-2. code-reviewer 지적 → ValidationResult 확장 → 일관성 + 보안 모두 확보. `validateQuery`의 kind 누락을 typecheck가 잡으면서 "기존 호출자 영향 자동 검출" 사례 재확인

### 2026-04-08 — [Architecture] RLS 정책은 기존 SECURITY DEFINER 헬퍼를 재사용해야 — inline EXISTS 금지
- **증상**: Task 2-M-B-1에서 `pipeline_events` 테이블 RLS를 작성할 때 `user_profiles.role = 'admin'` 체크를 inline `EXISTS (SELECT 1 FROM public.user_profiles ...)`로 구현. code-reviewer Must Fix로 지적됨
- **원인**: 프로젝트 전체 admin 정책 10곳+ (migration 001의 `prompts`, `prompt_versions`, `shops` 등)은 모두 `public.is_admin()` SECURITY DEFINER 헬퍼를 사용. 내 inline EXISTS는:
  1. **종속성 문제**: inline subquery는 `authenticated` 권한으로 실행되어 `user_profiles` 자체 RLS에 종속된다. 현재는 `user_profiles` SELECT 정책이 `is_admin()`도 허용하여 작동하지만, 향후 `user_profiles` RLS 강화 시 **silent break** (policy evaluation이 false로 떨어져 어떤 admin도 pipeline_events를 볼 수 없게 됨)
  2. **일관성 깨짐**: 같은 "admin인가?" 체크가 두 가지 다른 SQL 패턴으로 공존 → 읽는 사람 혼동 + 나중에 한 곳만 수정하는 버그
  3. `is_admin()`의 `SECURITY DEFINER`는 함수 소유자 권한으로 실행되어 `user_profiles` RLS를 우회 → 안전한 캡슐화. 나는 이 기능을 놓치고 raw SQL을 썼음
- **해결**: inline EXISTS → `USING (public.is_admin())` 1줄로 교체. 파일 수정 + `DROP POLICY` + `CREATE POLICY`로 DB 재적용
- **규칙**:
  1. **새 RLS 정책 작성 전 반드시 `grep -n "CREATE POLICY\|public\." migrations/*.sql`로 기존 헬퍼 확인**. `is_admin()`, `get_user_role()`, `is_owner()` 같은 헬퍼가 이미 있으면 재사용
  2. **RLS 정책에서 다른 테이블 조회 금지** — SECURITY DEFINER 함수로 감싸서 호출. RLS는 "이 테이블에 대한 접근 제어"고, "다른 테이블의 상태를 기반으로 한 접근 제어"는 함수로 추상화
  3. **일관성이 보안이다** — 같은 체크가 두 패턴으로 공존하면 하나만 수정되는 시점이 오고, 그때 보안 구멍이 생긴다
- **컨텍스트**: Session #17 Task 2-M-B-1. code-reviewer(독립 리뷰)가 Must Fix로 잡아냈음 → Writer/Reviewer 분리 가치 재확인

### 2026-04-08 — [AI-Pitfall] `ReturnType<typeof createSupabaseClient>` generic 누락 → `.from().insert()` never 추론
- **증상**: `src/lib/supabase/admin.ts`에서 `export function createAdminClient(): ReturnType<typeof createSupabaseClient>`로 작성. `createAdminClient().from("pipeline_events").insert({...})` 호출 시 TS2769: "Argument of type '{...}' is not assignable to parameter of type 'never'". 디버깅에 ~20분 소요
- **원인**: `@supabase/supabase-js`의 `createClient<Database, ...>` 제네릭 기본값이 generic 추론 체인에서 해석될 때 `Database`가 `{ PostgrestVersion: string }`으로 떨어지고, `.from("테이블명")`의 결과 타입이 `never`가 된다. `ReturnType<typeof ...>`로 감쌌을 때 이 현상이 발생. 반면 `@supabase/ssr`의 `createServerClient`는 다른 기본 동작을 가져서 `src/lib/supabase/server.ts`에서는 같은 문제 안 발생
- **해결**: `SupabaseClient` 클래스 타입을 직접 import해서 return type으로 명시 (`export function createAdminClient(): SupabaseClient`). `SupabaseClient`의 기본 generic은 `any`이지만 이는 SDK 내부 default이며 우리 코드에 명시적 `any` 키워드는 없음 (lint 규칙 우회 아님)
- **규칙**:
  1. **Supabase client return type을 `ReturnType<typeof createClient>`로 감싸지 말 것** — generic 없이 호출된 함수의 return은 `never` 추론 지옥. 차라리 `SupabaseClient` 클래스 타입을 직접 명시
  2. **이상적으로는 `supabase gen types typescript`로 `types/database.ts` 생성 → `SupabaseClient<Database>`로 강타입화**. 이 프로젝트는 Drizzle primary라 아직 안 했지만, 기술 부채로 기록
  3. **`createAdminClient` 같은 service_role client는 최초 사용 시점에 이 문제가 드러난다** — 만들 때 바로 호출 사이트 하나 써보고 타입 체크 통과 확인
  4. **일반적 원칙**: `ReturnType<typeof fn>`은 `fn`이 제네릭일 때 제네릭 기본값만 적용된다. 제네릭 함수의 return type이 필요하면 명시적 class/interface를 import해서 쓰자
- **컨텍스트**: Session #17 Task 2-M-B-1. logEvent 헬퍼가 `createAdminClient`의 최초 사용자라 구현 단계에서 드러남. 기존에는 server.ts `createClient`(ssr)를 썼기 때문에 문제 안 됐음

### 2026-04-07 — [Bug] `(dashboard)` 레이아웃 무한 리다이렉트 루프 ✅ 해결됨 (Session #15)
- **증상**: 로그인한 유저(onboarding 미완료)가 `/signup` 또는 `/products` 접근 시 `/onboarding`으로 리다이렉트 → `/onboarding` 페이지가 또 자기 자신으로 리다이렉트 → `ERR_TOO_MANY_REDIRECTS`
- **원인**: `src/app/(dashboard)/layout.tsx` L57-58, L75-76에서 `!profile.onboarding_completed` 또는 `!shop` 시 `redirect('/onboarding')`. 그런데 `/onboarding` 페이지 자체가 `(dashboard)` 라우트 그룹 안에 있어서 같은 레이아웃이 또 실행됨 → 또 같은 조건에 걸려서 또 redirect
- **해결 (실제 적용)**: `/onboarding` 페이지를 `(dashboard)` → `(onboarding)` 별도 라우트 그룹으로 이동. `(onboarding)/layout.tsx`를 신규 작성(인증 검증 + 완료 유저 재진입 차단). `(dashboard)/layout.tsx`는 0줄 수정. URL은 `/onboarding` 그대로 (Next.js 라우트 그룹은 URL에 영향 없음)
- **검증**: Playwright 4 시나리오 (`/onboarding`, `/products`, `/optimize`, `/settings`) 전부 단발성 200 종료, 무한 루프 흔적 0건. code-reviewer APPROVE WITH COMMENTS
- **규칙**: **리다이렉트 목적지 페이지는 리다이렉트를 발생시키는 레이아웃 하위에 두지 않는다.** Next.js 라우트 그룹 설계 시, "보호된 대시보드" vs "온보딩 플로우" vs "공개 페이지"는 **서로 다른 라우트 그룹**으로 분리. 예: `(dashboard)`, `(onboarding)`, `(public)` 세 그룹. 같은 `layout.tsx`가 재실행될 때 무한 루프가 생기는지 항상 체크.
- **컨텍스트**: Task 2-3 엔드-투-엔드 검증 중 브라우저 E2E에서 발견. curl 테스트는 미들웨어를 안 타서 이 버그가 안 보임. Playwright로 실제 로그인·페이지 이동을 해야 드러남. → **운영 검증은 실제 UI 경로까지 꼭 밟아야 한다**.

### 2026-04-07 — [Tooling] zsh에서 긴 curl 명령 복사 시 줄바꿈 파싱 오류
- **증상**: `curl -i -X POST "URL" -H "Header1" -H "Header2" -d @filepath` 같은 긴 한 줄 명령을 터미널에 붙여넣으면 `-d`와 `@filepath` 사이에서 분리되어 `curl: option -d: requires parameter` + `zsh: no such file or directory: @/...` 에러. `-H`와 다음 인자 사이에서도 같은 현상 발생
- **원인**: 터미널(iTerm/Terminal.app)이 긴 문자열을 수신할 때 내부 버퍼링/엔터 캐릭터 삽입으로 줄을 쪼갬. 또는 소스(클라이언트/문서)에서 자동 개행이 섞여 들어옴. 백슬래시 line continuation도 개행 위치가 정확해야 안전
- **해결**: **스크립트 파일로 저장 → bash 실행** 패턴이 가장 안전. `docs/n8n-workflows/test-curl.sh`처럼 변수 선언 + curl 블록을 파일에 저장하고 `bash <경로>` 한 줄만 복사. 또는 `cd <dir>` 먼저 + 상대 경로 사용으로 명령 길이 단축
- **규칙**: n8n/외부 webhook 디버깅용 curl 명령은 처음부터 `.sh` 스크립트로 만들어 `docs/n8n-workflows/` 밑에 보관. Jayden이 터미널에 직접 붙여넣지 않아도 되게. 재현성도 확보.
- **컨텍스트**: Task 2-3 엔드-투-엔드 검증에서 2~3회 복사 실패 후 스크립트화로 해결

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

### 2026-04-06 — [Architecture] PRD 부록 ≠ 진실 — 새 Phase 진입 전 list_tables 우선 검증
- **증상**: Session #12에서 Phase 2 진입 전 PRD 부록 C(DB 스키마 활용 계획)를 보고 4개 신규 테이블 추가가 필요해 보였음 (`optimization_history`, `llms_txt_versions`, `extraction_logs`, `cost_tracking`). 그런데 `list_tables`로 V2 현재 상태를 확인하니 `optimizations` 테이블이 이미 `idempotency_key`/`result_json`/`jsonld`/`score`/`error_message`/`duration_ms`/`retry_count`/`plan`/`status`를 모두 갖고 있어 사실상 `optimization_history`를 흡수한 상태였음. 결과적으로 신규 테이블은 1개(`llms_txt_versions`)만 필요했고, 나머지 3개는 흡수/JSONB내장/이연으로 정리.
- **원인**: PRD 부록 C는 V1 시절 작성되었고, 그 사이 V2 스키마 리노베이션(Session #4)이 일부 요구사항을 미리 흡수했지만 PRD가 그에 맞춰 갱신되지 않았음. PRD 부록을 그대로 작업 명세로 받아들이면 **이미 해결된 문제를 또 푸는 헛수고**가 발생.
- **해결**: 새 Phase 진입 전 강제 절차 도입 — (1) PRD 부록 = 청사진(요구사항), (2) `list_tables` 결과 = 진실(현재 상태). 두 가지를 표로 매핑한 후 갭을 **흡수됨 / 신규 / JSONB 흡수 / 이연** 4분류로 정리. 마이그레이션은 4분류 결정 후에만 작성.
- **규칙**:
  1. **새 Phase 진입 전 첫 작업은 항상 `list_tables(verbose=true)`**. PRD를 신뢰하기 전에 현재 DB 상태를 사실로 받아들인다.
  2. **PRD-스키마 갭은 4분류**: ① 흡수됨 (작업 불필요) / ② 신규 (마이그레이션 필요) / ③ JSONB 내장 (기존 jsonb 컬럼에 키로 저장) / ④ 이연 (다음 Phase로). 4분류로 정리하면 "정말 필요한 마이그레이션"만 남음.
  3. **PRD 부록은 명세가 아닌 청사진으로 다룬다**. 갱신 빈도가 코드/DB보다 낮아서 자연스럽게 stale해짐. PRD가 "X 테이블 추가"라고 해도 X가 이미 다른 형태로 존재할 가능성을 항상 의심.
  4. **OST 원칙의 DB 버전**: 진실은 한 곳(라이브 DB) → PRD/Drizzle 스키마/마이그레이션 파일은 동기화되지 않을 수 있음. 작업 시작 전 라이브 DB 우선.

### 2026-04-06 — [Security/Workflow] `.env*` 파일 LLM 권한 차단은 버그가 아니라 보안 기능
- **증상**: Session #12에서 Phase 2 환경변수(`N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`)를 `.env.example`에 추가하려 했더니 Read/Edit/Bash로 모두 접근 차단됨 ("Permission denied"). 첫 반응은 "권한 정책이 너무 빡빡하다"였음.
- **원인**: Claude Code 권한 정책이 `.env*` 패턴 전체를 LLM 직접 접근에서 차단. 처음엔 불편으로 느꼈지만, 사실 이 차단이 **시크릿 보호의 마지막 방어선**임. LLM이 실수로 `.env.local`을 덮어쓰면 운영 시크릿이 사라지고, `.env.example`에 잘못된 값(예: 실제 API 키 일부)을 쓰면 git 커밋을 통해 외부 노출될 수 있음. 권한 차단은 이 두 가지 사고를 시스템 레벨에서 차단함.
- **해결**: 직접 수정 시도 포기 → **Jayden 직접 입력 + 우리는 명세만 작성** 흐름으로 방향 전환. `docs/phase2-prerequisites.md` 같은 통합 prerequisites 문서를 만들고, 그 안에 (1) `.env.example` 추가 블록 그대로(복붙 가능), (2) `.env.local` 값 출처 표, (3) grep 검증 명령을 모두 담음. Jayden은 한 문서만 보고 직접 입력 + 검증.
- **규칙**:
  1. **`.env*` 파일은 LLM이 직접 만지지 않는다**. 우리는 항상 "추가할 블록"을 별도 문서에 코드 펜스로 명세 → Jayden이 복붙. 권한 정책이 차단을 풀어줘도 같은 원칙 유지.
  2. **prerequisites 통합 문서 패턴**: 환경변수 + 외부 서비스 체크리스트 + 검증 명령을 한 파일에 모은다. Jayden이 다음 세션 전에 한 곳만 보고 모든 외부 의존을 처리할 수 있도록.
  3. **권한 차단을 "불편"으로 받아들이지 말고 "보호 레이어"로 해석**. 처음 에러 메시지를 만나면 "이건 왜 막혔지?"가 아니라 "이걸 막는 게 합리적인가?"를 먼저 묻는다. 합리적이면 우회가 아니라 워크플로우를 차단에 맞춰 재설계.
  4. **이 원칙은 다른 시크릿 파일에도 일반화**: `secrets.json`, `*.pem`, `credentials/*`, `.aws/credentials` 등. 차단되어 있다면 그것은 보호. 명세 + Jayden 입력 흐름으로 우회.

### 2026-04-06 — [Architecture/AI-Pitfall] V7 n8n 워크플로우가 V1 DB 스키마 기반 — PRD-DB 갭 분석에 "기존 자동화" 축 누락
- **증상**: Session #13 Task 2-1 (V7 → V8 Claude 전환) 엔드-투-엔드 테스트에서 Claude API 호출과 응답 파싱은 모두 성공했으나 B3. DB 저장 단계에서 `"Could not find the 'buying_guide' column of 'products' in the schema cache"` (PGRST204) 에러로 차단. V7의 B3/P8 노드는 `products` 테이블을 `UPDATE`하며 `autoMapInputData`로 18~20개 AI 결과 필드(optimized_title, buying_guide, faqs, eeat_score 등)를 동일 이름 컬럼에 직접 매핑하는 구조였음.
- **원인**: V7 n8n 워크플로우는 **V1 DB 스키마**(AI 결과 필드가 `products` 테이블에 직접 컬럼으로 존재) 기반으로 설계됨. V2 재설계에서 AI 최적화 결과는 `optimizations.result_json` (jsonb)에 통째로 저장하는 방식으로 바뀌었지만, 워크플로우는 이 변경을 반영하지 않음. Session #12 "PRD vs V2 DB 갭 분석"에서 **"기존 자동화 코드(n8n) ↔ 현재 DB"** 정합성 축은 검증 대상에 포함되지 않았음. Task 2-1 Plan에서도 "Supabase 노드라 DB 스키마 동일" 가정으로 `products` 테이블 직접 참조 가능성을 간과.
- **해결**: Task 2-1은 Claude 전환 범위까지만 완료 처리. DB 저장 재설계는 Task 2-1b로 분리 (B2/P7 JS 재작성 + B3/P8 대상 테이블 변경 `products` UPDATE → `optimizations` INSERT + `idempotency_key` 매핑). 중간 진행 교훈은 즉시 learnings.md에 기록.
- **규칙**:
  1. **기존 워크플로우/자동화 재사용 시 "DB 정합성"은 초기 스코프 분석에 필수 포함**. V7 같은 기존 n8n 워크플로우를 수정할 때는 (1) HTTP/API 호출부뿐 아니라 (2) DB 쓰기 노드의 `tableId` + 매핑 컬럼도 Plan 단계에서 **실제 현재 스키마와 대조**한다. 노드 파라미터를 `jq`로 추출해서 확인하는 것은 3분 작업.
  2. **PRD-DB 갭 분석은 3축**: ① 현재 DB ↔ PRD (Session #12에서 수행) ② **기존 자동화 ↔ 현재 DB** (이번에 누락) ③ 기존 자동화 ↔ PRD. 세 축을 모두 검증해야 "숨은 지뢰"가 없음.
  3. **Task Plan의 "안 건드리는 것" 섹션은 실측 후 선언**. "Supabase 노드이니 DB 스키마 동일 가정"은 근거 없는 낙관. 안 건드릴 노드여도 그 노드가 참조하는 외부 리소스(DB 컬럼, API 응답 필드)가 현재 상태와 일치하는지 확인한 뒤 "안 건드림"을 선언해야 함.
  4. **V1 → V2 마이그레이션 후에는 "V1 기반 외부 자산 목록"을 작성**. V1 스키마를 전제로 만든 n8n 워크플로우/스크립트/SQL 뷰 등이 V2에 맞지 않을 수 있으므로, DB 리노베이션 후 "재검증 대상 외부 자산" 리스트를 만들어 체계적으로 점검한다.
  5. **긍정 신호도 교훈이다**: 이번 실패에서 Claude 전환 자체는 12/12 검증 통과했고 실제 API 호출까지 성공했다. 즉 Plan의 "변환 로직"은 정확했고 실패 지점은 "범위 외" 부분이었다. Plan 수립 시 범위 경계를 정확히 치는 것이 크리티컬 — 범위 내부가 견고하면 실패해도 "범위 밖"으로 분리해 Task를 쪼갤 수 있음.

### 2026-04-07 — [Architecture] n8n Supabase 노드 `autoMapInputData` + jsonb 자동 직렬화 — 중첩 객체를 그대로 전달
- **증상**: Task 2-1b에서 B2/P7 최종 정리 노드의 return에 `result_json` (중첩 객체 18개 필드) + `jsonld` (객체) 를 그대로 포함. n8n Supabase `create` 오퍼레이션이 이를 `optimizations` 테이블의 jsonb 컬럼에 올바르게 저장할지 불확실했음. `JSON.stringify`를 수동으로 해야 할지 고민.
- **원인**: n8n 공식 문서가 Supabase 노드의 jsonb 컬럼 자동 매핑 동작을 명시적으로 설명하지 않음. OpenAPI 스키마 기반이지만 사용자 관점에서는 "객체가 string으로 직렬화되어 저장될지" vs "jsonb로 native 저장될지" 예측 어려움.
- **해결**: `dataToSend: "autoMapInputData"` + return json에 **객체를 있는 그대로** (stringify 없이) 포함. 실측 결과 Supabase 노드가 컬럼 타입(jsonb)을 자동 감지해서 직렬화 → `result_json` 9,617 bytes 정상 저장, `jsonb_array_length` / `jsonb_object_keys` 쿼리 정상 작동.
- **규칙**:
  1. **n8n Supabase 노드 + jsonb 컬럼에는 객체를 그대로 전달**. 수동 `JSON.stringify` 하면 오히려 "jsonb에 string이 한 번 더 감싸져 저장"되는 버그 발생 (double-encoding).
  2. **`dataToSend: "autoMapInputData"` 는 n8n의 Supabase OpenAPI 스키마 기반 자동 타입 매칭 기능**. 입력 키 이름과 테이블 컬럼 이름이 일치하면 자동 매칭, 타입도 컬럼 정의에서 추론. 수동으로 매핑할 필요 없음.
  3. **검증 방법**: 저장 후 `SELECT jsonb_array_length(result_json->'faqs')`, `SELECT jsonb_object_keys(result_json)` 로 jsonb 쿼리가 정상 작동하면 string이 아니라 진짜 jsonb로 저장된 것. string으로 저장됐다면 이런 jsonb 연산자가 에러를 뱉음.
  4. **V1→V2 마이그레이션 시 "jsonb 통합 저장" 패턴의 장점**: 기존 V1은 AI 결과 필드(18개)를 모두 테이블 컬럼으로 flatten했지만, V2는 `result_json` jsonb 하나로 통합. 스키마 진화가 자유로움 (새 AI 필드가 추가돼도 마이그레이션 불필요), 쿼리는 `result_json->>'optimized_title'` 식으로 접근.

### 2026-04-07 — [AI-Pitfall] `"use server"` 파일은 type re-export도 런타임에 RPC로 오인함
- **증상**: Session #14 Task 2-3에서 `features/optimize/actions.ts` ("use server") 마지막에 `export type { OptimizationPlan };`을 두었는데 `pnpm build`가 실패. 에러: `Export OptimizationPlan doesn't exist in target module ... Did you mean to import runOptimization?`. 타입만 re-export했을 뿐인데 Next.js가 런타임 action 심볼을 찾으려 시도.
- **원인**: Next.js Server Actions는 `"use server"` 파일의 모든 export를 RPC 엔드포인트로 변환한다. TypeScript의 `export type` 문은 컴파일 시 소거되지만 Next.js의 Turbopack 번들러는 파일을 스캔할 때 **런타임 심볼 테이블**을 기준으로 action 레퍼런스를 생성해 actions.js 프록시 파일을 만드는데, 여기서 type export를 "없는 심볼"로 간주하면서도 프록시에는 그 이름을 포함시킴 → 런타임 import 실패. 요약: `"use server"` 파일은 **type export도 금지**. Session #11의 "use server 동기 함수/상수 금지" 교훈의 확장.
- **해결**: `actions.ts` 내부에서는 `import type { OptimizationPlan as OptimizationPlanType }` + `type OptimizationPlan = OptimizationPlanType;`로 로컬 alias만 두고 **외부 re-export는 제거**. 외부 소비자는 `validation.ts`에서 직접 import. `index.ts` barrel은 `./validation`과 `./actions`에서 각각 적절한 심볼을 가져와 합친다.
- **규칙**:
  1. **`"use server"` 파일에서 export 금지 대상 (확장판)**: ① 동기 함수 (Session #11 교훈) ② 상수 (Session #11 교훈) ③ **타입 (`export type`, `export interface`)** ④ `type` alias만 내부 사용은 OK.
  2. **Server Action 파일의 export는 "런타임에 Promise를 반환하는 async function"만**. 그 외는 sibling `validation.ts` 또는 `types.ts`로 분리.
  3. **빌드 실패 에러 메시지 해석**: `Export X doesn't exist in target module` + `Did you mean to import <actionName>`는 **`"use server"` 파일의 export 오염**을 의심하는 1순위 신호. typecheck는 통과하지만 build에서만 잡힘 → typecheck만으로는 부족, build까지 검증 게이트에 포함 필수.
  4. **비유**: "use server" 파일은 카운터 창구와 같다. 창구에는 "주문을 받아 처리하는 직원(async 함수)"만 둘 수 있고, 메뉴판(type)이나 계산기(상수)는 창구 뒤 주방(validation.ts)에 둬야 한다.

### 2026-04-07 — [Security/Architecture] SELECT-INSERT race는 partial unique index가 최종 답
- **증상**: Session #14 Task 2-3 리뷰에서 code-reviewer + security-reviewer가 동시에 HIGH로 지적. `runOptimization` Server Action이 "5분 내 동일 (product_id, plan)에 진행 중인 row가 있는지 SELECT → 없으면 INSERT" 흐름을 쓰는데, 두 SELECT가 동시에 `duplicates=[]`를 받으면 둘 다 INSERT → n8n webhook 2번 호출 → Anthropic API 비용 2배. 매 요청 `crypto.randomUUID()`로 다른 키를 쓰므로 기존 `UNIQUE(idempotency_key)` 제약은 무용.
- **원인**: 애플리케이션 레벨의 "SELECT 후 INSERT" 패턴에 race window가 있는 것은 모든 동시성 시스템의 기초 문제. Postgres SERIALIZABLE isolation을 쓰지 않는 한 두 트랜잭션이 같은 SELECT 결과를 보고 둘 다 INSERT 진행할 수 있음. 보안 리뷰어의 지적 — "빠른 더블 클릭 + `Promise.all` 공격"이 구체적 attack surface.
- **해결**: 마이그레이션 005에서 **partial unique index** 생성:
  ```sql
  CREATE UNIQUE INDEX optimizations_active_unique
    ON public.optimizations (product_id, plan)
    WHERE status IN ('queued', 'processing');
  ```
  두 번째 INSERT가 `Postgres 23505 (unique_violation)`으로 실패. Server Action이 `insertError?.code === "23505"`를 잡아 `DUPLICATE_IN_FLIGHT`로 매핑 + 기존 진행 중 row id 조회해서 반환. 완료된 (completed/failed) row는 인덱스에 포함 안 되므로 재실행/재시도 자유.
- **규칙**:
  1. **애플리케이션 레벨 중복 체크는 UX용, 실제 차단은 DB constraint로**. "SELECT → INSERT" 코드에는 무조건 race window가 있고, 이를 없애려 application lock/mutex를 쓰는 것은 과잉. DB의 partial unique index가 가장 단순하고 원자적.
  2. **"활성 row만 unique" 제약은 partial index 사용**. 전체 unique는 재실행 case를 막아서 부작용 큼. `WHERE status IN ('queued','processing')` 같은 WHERE 절로 "진행 중"만 제약 → 완료 후 재실행/재시도는 자유.
  3. **Postgres error code를 Server Action에서 분기**: `23505`(unique_violation), `23503`(foreign_key_violation), `23514`(check_violation) 등은 공식 에러 코드. `insertError?.code === "23505"` 같은 분기로 "race가 일어났구나"를 감지하고 UX 메시지로 전환.
  4. **비유**: "줄 서기"는 두 종류. 하나는 "줄 앞에 사람이 있는지 보고 없으면 입장(앱 체크)" — 빠르지만 두 사람이 동시에 보면 둘 다 입장. 다른 하나는 "입구에 turnstile 하나만 있어서 물리적으로 한 명만 통과 가능(DB 제약)" — 느리지만 완벽. 실전에서는 둘 다 쓴다: UX는 앱 체크로 부드럽게 안내하고, 실제 차단은 turnstile(DB)이.

### 2026-04-07 — [Bug] Realtime/폴링 setState에서 `??`가 `null` 값을 stale로 취급
- **증상**: Session #14 Task 2-3 리뷰에서 code-reviewer HIGH로 지적. `optimization-status.tsx`의 `applyRowUpdate`가 Realtime postgres_changes payload와 폴링 결과를 병합할 때 `row.error_step ?? prev.errorStep` 패턴 사용. n8n 워크플로우가 "실패 상태에서 recovery" 시그널로 `error_step = null`을 UPDATE해도 UI는 옛날 error_step을 계속 표시. status와 error_step이 어긋난 상태로 렌더링됨.
- **원인**: JavaScript `??` (nullish coalescing)는 `null`과 `undefined` 둘 다 fallback 트리거. 즉 "DB가 의도적으로 null로 리셋한 값"과 "DB가 해당 컬럼을 건드리지 않음(undefined)"을 구분하지 못함. Supabase Realtime postgres_changes 페이로드의 `payload.new`는 **UPDATE된 컬럼만** 포함하는 게 아니라 **전체 row를 새 값으로** 보냄 → null이 의도적 리셋을 의미함에도 `??`는 이전 값으로 되돌림.
- **해결**: `pickNullable<T>(raw: unknown, prev: T): T` 헬퍼 추가 — `raw !== undefined ? (raw as T) : prev`. 각 필드에 `pickNullable(row.error_step, prev.errorStep)` 형태로 사용. 이 함수는 **undefined**(컬럼 누락)만 prev로 fallback하고 **null**은 명시적 업데이트로 간주. Realtime payload.new는 row 전체를 보내므로 사실상 모든 필드가 항상 present → `undefined` 케이스는 거의 없고 대부분 값 그대로 반영됨.
- **규칙**:
  1. **"diff merge" 시 `??` 금지**. "컬럼이 이 페이로드에 존재하지 않음(undefined)"과 "컬럼이 의도적으로 null로 업데이트됨(null)"을 구분해야 하는 상황에서는 `!== undefined` 패턴 사용. `??`는 기본값 설정용으로만.
  2. **Supabase Realtime postgres_changes 페이로드는 "new row 전체"**. 따라서 모든 컬럼이 항상 present (`undefined`가 되는 경우는 스키마 변경 중일 때뿐). 이 전제 하에서는 null은 항상 "진짜 null"로 해석해야 함.
  3. **함께 해결해야 할 안전장치**: 외부 시스템(Realtime 구독 / 폴링)에서 오는 status 값은 **whitelist 검증** 후에만 state에 반영 (`VALID_STATUSES: ReadonlySet`). 예상 밖 status가 들어와도 이전 상태 유지.
  4. **비유**: 택배 기사가 "이 상자 안 내용물 없음"(null)이라고 말할 때 vs "이 상자는 안 가져왔음"(undefined)이라고 말할 때 — 둘은 완전히 다른 의미. `??`는 이 둘을 같은 말로 취급.

### 2026-04-07 — [Architecture] 30초~3분 AI 작업은 동기 금지 — 비동기가 산업 표준
- **증상**: Session #14 Task 2-3 Plan 초안에서 "MVP는 동기 await + spinner, 추후 Task 2-5에서 비동기로 리팩토링" 계획이었다. Jayden의 "유사 서비스 딥리서치" 요청으로 12+ 출처(fal.ai, Replicate, OpenAI Background, Vercel deploys, Loom, Midjourney, Runway, Frase 등)를 조사한 결과, **30초 이상 걸리는 작업에 동기 spinner를 쓰는 프로덕션 SaaS는 한 곳도 없음**을 확인. 즉 Task 2-5를 Task 2-3에 처음부터 흡수해야 재작업이 없음.
- **원인**: 동기 await + spinner는 여러 문제를 동시에 야기: (1) 사용자가 2분 35초 빈 화면을 봐야 함 (Premium 실측), (2) Vercel serverless 함수 duration 한계 (Hobby 300s / Pro 800s — 2025 Fluid Compute 기준), (3) 브라우저 탭 전환/네트워크 변경 시 요청이 끊기면 사용자가 결과를 못 찾음, (4) 진행 상황 없음. 비동기 패턴(queued INSERT → fire + redirect → Realtime/폴링)은 이 4가지를 모두 해결.
- **해결**: Plan v3에서 Task 2-3 + 2-4 + 2-5를 한 묶음으로 흡수. Server Action이 optimizations row를 `status='queued'`로 먼저 INSERT → n8n webhook "Respond: Immediately" 모드로 호출(1~3초 반환) → row id 반환 → 클라이언트가 `/optimize/[id]`로 redirect → 상태 페이지에서 Supabase Realtime + 5초 폴링으로 status 추적 → n8n이 완료 시 row UPDATE → UI 자동 갱신. 30초+ 작업은 동기 패턴보다 "비동기 골격을 처음부터" 만드는 게 **재작업 0** + UX도 더 좋음.
- **규칙**:
  1. **30초+ 외부 API 호출은 처음부터 비동기**. 동기 MVP → 비동기 리팩토링 경로는 "같은 코드 두 번 작성". 차라리 처음부터 비동기 골격만 얇게 만들고 UI 디테일은 점진 개선.
  2. **비동기 패턴의 4 요소**: ① DB row를 queued 상태로 먼저 INSERT → ② 외부 API는 "Respond: Immediately" 모드 또는 fire-and-forget → ③ 클라이언트 즉시 redirect → ④ Realtime/폴링/SSE로 결과 추적. 이 4개가 하나라도 빠지면 완전한 비동기가 아님.
  3. **n8n webhook은 "Respond: Immediately" 모드를 활용**. 기본 "When Last Node Finishes"는 워크플로우 완료까지 대기 — 이건 "동기 모드". UI에서 한 번 클릭으로 전환 가능.
  4. **Vercel serverless 가정 재검증**: 2025년 Fluid Compute default 활성화로 Hobby 300s / Pro 800s로 확장됨. 이전의 "Hobby 10s / 60s" 가정은 이제 무효. 하지만 **timeout이 UX 이유의 전부가 아님** — 2분 이상 사용자가 빈 화면 보는 건 timeout과 무관하게 UX 실패.
  5. **딥리서치 ROI**: 단 하나의 리서치(12 출처)가 Plan의 근본 방향을 바꿨다. 비유 — "같은 건물을 두 번 짓지 않는 최선의 방법은 짓기 전에 레퍼런스 건물들을 돌아보는 것". "리서치 후 Plan 변경 비용 < 잘못된 Plan으로 구현 후 리팩토링 비용"이 거의 항상 성립.

### 2026-04-07 — [Architecture] Chatsio 사용자 FK는 `user_profiles` (auth.users 아님) + Findably는 `profiles` — 2 프로젝트 분리 주의
- **증상**: Task 2-1b DB 시드 생성 시 `INSERT INTO shops(user_id, ...) VALUES ((SELECT id FROM auth.users LIMIT 1), ...)` 실행 → `ERROR: insert or update on table "shops" violates foreign key constraint "shops_user_id_fkey". Key (user_id)=... is not present in table "user_profiles"`. 첫 시도부터 FK 위반.
- **원인**: Chatsio는 `auth.users`를 직접 참조하지 않고 **중간 테이블 `user_profiles`**를 둠 (RLS 정책 + 역할 관리 + onboarding 상태 등을 확장). `shops.user_id → user_profiles.id → auth.users.id` 3단계 체인. 한편 Findably는 동일 공유 DB에서 **`profiles`** 테이블을 사용 (`user_profiles`와 이름 다름). 두 프로젝트가 같은 `auth.users`를 공유하지만 각자의 middle 테이블 이름이 다름 → 헷갈리기 쉬움.
- **해결**: Chatsio 테스트 시드 체인을 `auth.users → user_profiles → shops → products` 순서로 3단계 INSERT. user_profiles의 NOT NULL 컬럼은 `id` (기본값 없음, 명시 필요) + `role`(default member) + `onboarding_completed`(default false). `INSERT INTO user_profiles (id, role, onboarding_completed) VALUES ('<auth.users uuid>', 'member', true) ON CONFLICT (id) DO NOTHING`.
- **규칙**:
  1. **Chatsio FK 체인 암기**: `auth.users → user_profiles.id → shops.user_id → products.shop_id → optimizations.{product_id, shop_id}`. 새 테스트 데이터는 이 순서로 생성.
  2. **Findably와 테이블 이름 혼동 금지**: Chatsio = `user_profiles`, Findably = `profiles`. 공유 DB이므로 둘 다 존재. Chatsio 작업 중 Findably 테이블 건드리지 말 것 (learnings.md 2026-04-06 "공유 DB 경계" 규칙 참조).
  3. **시드 데이터 영구 vs 일회성**: Task 2-1b에서는 영구 선택 (실제 OAuth 세팅 후 자연 대체). 다음 시드가 필요할 때 `ON CONFLICT DO NOTHING`로 멱등성 유지.
