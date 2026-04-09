# log-event API Runbook

> `POST /api/v1/internal/log-event` 운영 절차 — 시크릿 rotation, 알람, V2 계획.
>
> 생성: 2026-04-08 (Task 2-M-B-2)
> 보안 등급: 🔴

## 역할

n8n Error Handler 워크플로우가 Chatsio 외부에서 `pipeline_events` 테이블에
에러/경고 이벤트를 기록할 수 있도록 여는 **내부 전용** HTTP 엔드포인트.

- 방식: Bearer 토큰 인증 + Zod 스키마 검증 → `logEvent()` fire-and-forget
- 응답 200: 성공 (DB insert 실패 시에도 generic 200 — fire-and-forget 설계)
- 응답 400: 페이로드 invalid (generic 메시지만, Zod 상세는 server log)
- 응답 401: 인증 실패
- 응답 500: 서버 환경변수 오류 또는 내부 에러

## 환경변수

| 이름 | 위치 | 생성 방법 | 역할 | 비고 |
|---|---|---|---|---|
| `INTERNAL_LOG_EVENT_SECRET_PRIMARY` | `.env.local` (로컬) | `openssl rand -hex 32` | 현재 활성 토큰 | **필수** / 64자 hex |
| `INTERNAL_LOG_EVENT_SECRET_PRIMARY` | Vercel Env (Preview + Production) | 로컬과 동일 값 복사 | 현재 활성 토큰 | **필수** |
| `INTERNAL_LOG_EVENT_SECRET_SECONDARY` | `.env.local` + Vercel | `openssl rand -hex 32` | rotation 기간 동안만 설정 | **옵션** (rotation 중에만) |
| `UPSTASH_REDIS_REST_URL` | `.env.local` + Vercel | Upstash Dashboard → DB → REST API → `.env` 탭 복사 | rate limiter Redis 엔드포인트 | **프로덕션 필수** / 로컬 옵션 |
| `UPSTASH_REDIS_REST_TOKEN` | `.env.local` + Vercel | 위와 동일 | rate limiter Redis 인증 토큰 | **프로덕션 필수** / 로컬 옵션 |
| n8n Credential | n8n instance → Credentials → HTTP Header Auth | Name: `Authorization` / Value: `Bearer <secret>` | n8n 호출 시 PRIMARY 값 사용 | Error Handler 노드에서 참조 |

**최소 길이 제약**: `src/lib/env.ts`의 `getInternalLogEventEnv()`가 PRIMARY 32자 미만 또는 누락 시 throw → 엔드포인트가 500. SECONDARY는 설정될 때만 32자 이상 검증.

**Upstash 옵셔널 규칙**: `UPSTASH_REDIS_REST_URL`과 `UPSTASH_REDIS_REST_TOKEN`은 **둘 다 설정하거나 둘 다 비워야** 한다(Zod refine). 둘 다 비어있으면 rate limiter가 no-op 모드로 통과시킨다 — 로컬 dev/CI에서 Upstash 계정 없이 API가 동작하도록 하기 위한 설계. 프로덕션에서는 반드시 두 값을 등록해야 flooding 방어가 활성화된다.

## 🚀 배포 전 등록 체크리스트 (Session #23 B-2)

처음 배포하거나 새 프로덕션 환경에 log-event API를 활성화할 때 따라가는
체크리스트. Vercel Env + n8n Credential + Upstash Redis 세 곳에 값을 넣어야
엔드포인트가 정상 동작한다.

### Phase 1 — 값 준비 (로컬)

```bash
# 1-A. INTERNAL_LOG_EVENT_SECRET_PRIMARY 생성
openssl rand -hex 32
# → 64자 hex 출력. 이 값을 안전한 임시 저장소에 보관 (예: Bitwarden/1Password)
# 🔴 채팅창/슬랙/이메일에 붙여넣기 금지

# 1-B. Upstash Redis 값 준비
# Upstash Dashboard → chatsio-ratelimit DB → REST API → ".env" 탭 복사.
# 두 값이 있어야 함:
#   UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
#   UPSTASH_REDIS_REST_TOKEN="AXXXxxxx..."
```

### Phase 2 — Vercel Env 등록 (Preview + Production 둘 다)

Vercel Dashboard → 프로젝트 → Settings → Environment Variables:

| 이름 | 값 | Environment | Sensitive |
|---|---|---|---|
| `INTERNAL_LOG_EVENT_SECRET_PRIMARY` | Phase 1-A의 hex | Preview + Production | ✅ |
| `UPSTASH_REDIS_REST_URL` | Phase 1-B의 URL | Preview + Production | (optional) |
| `UPSTASH_REDIS_REST_TOKEN` | Phase 1-B의 token | Preview + Production | ✅ |

**주의**:
- 🔴 Sensitive 플래그 필수 — Vercel이 로그/UI에서 값을 가리게 한다.
- **"Preview"와 "Production" 둘 다 체크** — 한쪽만 넣으면 Preview 배포 시 500.
- SECONDARY는 rotation 중에만 추가. 첫 배포에선 비워둠.
- 저장 후 **재배포 트리거 필수**. Vercel은 env 변경만으로는 재배포 안 함.
  → Deployments → 최근 배포 → "Redeploy" 클릭 (또는 git push 빈 커밋).

### Phase 3 — n8n Credential 등록

n8n instance → Credentials → **+ Add Credential** → **HTTP Header Auth**:

| 필드 | 값 |
|---|---|
| Credential Name | `Chatsio Log Event API` (알아보기 쉬운 이름) |
| Name (header) | `Authorization` |
| Value | `Bearer <Phase 1-A의 hex>` — **Bearer 뒤 공백 1칸 필수** |

저장 후 Error Handler 워크플로우의 HTTP Request 노드에서 이 credential을
선택한다. URL은 `https://<chatsio-prod-domain>/api/v1/internal/log-event`.

### Phase 4 — 검증 (3종 테스트)

Vercel 재배포 완료 후 프로덕션 URL로 검증:

```bash
PROD="https://<chatsio-prod-domain>"

# 4-A. 인증 누락 → 401
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST "$PROD/api/v1/internal/log-event" \
  -H "Content-Type: application/json" \
  -d '{"service":"n8n","level":"info","message":"test"}'
# 기대: 401

# 4-B. 틀린 토큰 → 401
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST "$PROD/api/v1/internal/log-event" \
  -H "Authorization: Bearer <INVALID_TOKEN_PLACEHOLDER>" \
  -H "Content-Type: application/json" \
  -d '{"service":"n8n","level":"info","message":"test"}'
# 기대: 401 (placeholder는 실제 실행 시 임의 문자열로 치환)

# 4-C. n8n Error Handler에서 테스트 실행 (Trigger workflow manually)
#      → Supabase MCP로 pipeline_events 테이블에서 새 row 확인
#      SELECT * FROM pipeline_events
#      WHERE service = 'n8n' AND created_at > NOW() - INTERVAL '2 minutes'
#      ORDER BY created_at DESC LIMIT 5;
```

### Phase 5 — 값 폐기

- Phase 1-A의 임시 저장소에 저장한 hex 값 삭제 (`.env.local`과 Vercel,
  n8n 3곳에만 남도록)
- Bitwarden/1Password처럼 감사 로그가 있는 저장소를 쓴다면 접근 이력 기록
- **터미널 history에 hex가 남았다면 `history -d <line>` 또는 shell 재시작**

### 체크리스트 요약

- [ ] `openssl rand -hex 32`로 INTERNAL_LOG_EVENT_SECRET_PRIMARY 생성
- [ ] Upstash Dashboard에서 REST URL + TOKEN 복사
- [ ] Vercel Env에 3개 변수 등록 (Preview + Production, Sensitive ✅)
- [ ] Vercel 재배포 트리거 + 완료 대기
- [ ] n8n Credential `Chatsio Log Event API` 생성 (Bearer 공백 확인)
- [ ] 401 검증 2건 (무인증, 틀린 토큰) 모두 통과
- [ ] n8n 수동 트리거 → Supabase에 row 생성 확인
- [ ] 임시 저장소 정리 + 터미널 history 삭제

## 🔄 Zero-downtime rotation 절차 (Task 4에서 구현됨 ✅)

구현 위치: `src/app/api/v1/internal/log-event/route.ts`의 `checkToken()` 함수.
요청 토큰은 PRIMARY와 SECONDARY **양쪽과 항상 상수 시간 비교**되어 한쪽이라도
일치하면 통과한다. SECONDARY가 없어도 dummy 비교로 타이밍 일관성 유지.

rotation 시점: (1) 의심 사건 발생 / (2) 분기별 예방 rotation / (3) 팀원 off-boarding.

### 표준 절차 (무중단, 약 5분)

```
Phase 1 — 새 토큰 발급 + 이중 허용
  1. openssl rand -hex 32 → NEW_SECRET 생성
  2. 현재 PRIMARY 값을 별도 메모
  3. Vercel Env 설정:
     - INTERNAL_LOG_EVENT_SECRET_PRIMARY = <NEW_SECRET>  (덮어쓰기)
     - INTERNAL_LOG_EVENT_SECRET_SECONDARY = <이전 PRIMARY>  (새로 추가)
  4. Vercel 재배포 트리거 → 배포 완료 대기 (1~2분)
     → 이 시점에 구 토큰(SECONDARY) + 신 토큰(PRIMARY) 모두 유효

Phase 2 — n8n 호출자 전환
  5. n8n Credentials → Chatsio log-event 크리덴셜 편집
  6. Authorization 헤더 값을 `Bearer <NEW_SECRET>`로 교체
  7. Error Handler 워크플로우 테스트 실행 → pipeline_events에 테스트 event
     추가되는지 Supabase MCP로 확인

Phase 3 — 구 토큰 회수
  8. Vercel Env에서 INTERNAL_LOG_EVENT_SECRET_SECONDARY 삭제
  9. Vercel 재배포 트리거 → 배포 완료 대기
 10. 구 토큰(이전 PRIMARY)은 이제 거부됨 → rotation 완료

Phase 4 — 검증
 11. 3분 동안 pipeline_events에 401 에러 이벤트(n8n 인증 실패)가 없는지
     `SELECT * FROM pipeline_events WHERE step LIKE '%unauthorized%'
      AND created_at > NOW() - INTERVAL '3 minutes'`
 12. `.env.local`도 새 값으로 업데이트 (팀원이 로컬 dev에서 테스트 가능하게)
```

### 왜 PRIMARY에 새 값을 먼저 넣는가
호출자(n8n)는 여전히 구 토큰을 쓰고 있으므로, 배포 직후 구 토큰이 거부되면
프로덕션 이벤트가 누락된다. 구 토큰을 SECONDARY로 옮겨 **이중 유효** 상태를
먼저 만든 뒤, 호출자를 전환하고, 마지막에 SECONDARY를 제거하는 순서가 핵심.

### 긴급 rotation (compromised — 구 토큰 즉시 무효화)
구 토큰이 유출된 정황이 있다면 Phase 2 없이 진행:
```
1. openssl rand -hex 32 → NEW_SECRET
2. Vercel Env: PRIMARY = NEW_SECRET (덮어쓰기), SECONDARY 설정 안 함
3. Vercel 재배포 → 구 토큰 즉시 무효
4. n8n Credential 즉시 교체 → 재배포 대기 동안 n8n은 인증 실패 상태
5. pipeline_events에 401 에러가 rotation 창 동안 쌓임 (수용 가능한 trade-off)
```

## Supabase Alert 설정 (Task 2-M-B-3-B, Session #25)

Upstash Redis rate limiter(Task 2-M-B-3-A) 이후 **2차 방어선**. rate limiter를
뚫고 들어오는 flooding 또는 rate_limit_exceeded 이벤트 급증을 DB 내부에서
감지하고 Telegram 봇으로 한국어 알림 발송.

### 구성 — DB 내부 완결 (외부 의존 0)

```
pg_cron (매 분 실행)
  → notify_rate_limit_spike() 함수
  → vault.decrypted_secrets (telegram_bot_token / chat_id)
  → net.http_post → api.telegram.org/sendMessage
  → pipeline_events.alert_fired 이벤트 기록
```

**핵심 설계**:
- **pg_cron**: 매 분 00초에 함수 호출 (Supabase 기본 확장)
- **pg_net**: 함수 내부에서 Telegram API 비동기 호출 (fire-and-forget)
- **Vault**: 토큰/chat_id는 `.env`/코드가 아닌 Supabase Vault(`Integrations → Vault → Secrets`)에 암호화 저장
- **쿨다운 5분**: 같은 급증이 연속 감지되어도 5분에 1회만 알림 (DB 이벤트 기반, 재배포 견고)
- **한국어 메시지**: 운영자 가독성 (Task #6 반영)
- **Fail-safe**: 함수 내부 `EXCEPTION WHEN OTHERS`로 cron 계속 돌음

### 임계값

```
v_threshold := 50       -- 분당 50건 초과 시 알림
v_cooldown := 5 minutes  -- ⚠️ 운영 배포 전 '5 minutes 5 seconds' 로 여유 추가 권장 (cron jitter 대응, learnings Session #25 #3)
```

임계값 근거:
- **정상**: 분당 한 자릿수 (실패한 optimization run마다 수 개)
- **주의 (50 초과)**: rate limiter가 Upstash에서 차단한 이벤트가 분당 50건 넘음 → 정상 운영 범위 벗어남 → 알림
- **Upstash rate limit 100건**과 다른 이유: rate_limit_exceeded는 "차단된 요청" 자체의 건수. rate limiter가 작동 중이어도 flooding 공격은 수천~수만 건 시도 → 50 초과는 이미 이상 시그널

### 구현 파일

- **SQL**: `supabase/migrations/007_notify_rate_limit_spike.sql` — extensions + 함수 + cron job (멱등 재등록 가능)
- **Vault Secrets**:
  - `telegram_bot_token` (BotFather 발급)
  - `telegram_chat_id` (운영자 개인 chat_id, 다중 수신자는 그룹 chat_id 사용)

### 운영 검증 쿼리

```sql
-- 1. Cron job 상태 (active=t 여야 함)
SELECT jobid, jobname, schedule, active FROM cron.job
WHERE jobname = 'rate-limit-spike-alert';

-- 2. 최근 실행 기록 (매 분 succeeded)
SELECT runid, status, return_message, start_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'rate-limit-spike-alert')
ORDER BY start_time DESC LIMIT 10;

-- 3. 알림 발송 이력 (context_type='rate_limit_spike')
SELECT created_at, step, LEFT(message, 120) FROM pipeline_events
WHERE context_type = 'rate_limit_spike'
ORDER BY created_at DESC LIMIT 20;

-- 4. pg_net HTTP 응답 (status 200 이어야 정상)
SELECT id, status_code, LEFT(content::text, 150) AS response, created
FROM net._http_response ORDER BY created DESC LIMIT 5;

-- 5. 지난 24시간 알림 발송 빈도
SELECT DATE_TRUNC('hour', created_at) AS hour, COUNT(*) AS alerts
FROM pipeline_events
WHERE step = 'alert_fired' AND context_type = 'rate_limit_spike'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1 ORDER BY 1 DESC;
```

### 장애 대응 — 알림이 안 올 때

```
1. cron job 비활성화 의심 → `SELECT active FROM cron.job WHERE jobname='rate-limit-spike-alert'`
2. 함수 에러 누적 의심 → pipeline_events에서 step='alert_function_error' 조회
3. Vault secret 누락 → step='alert_failed', context_type='rate_limit_spike' 조회
4. Telegram API 401/404 → net._http_response에서 status_code ≠ 200 조회 → 토큰 revoke 여부 확인
5. 쿨다운으로 인한 suppress (정상 동작이지만 의심될 때) → step='alert_suppressed' 조회
```

## V2 계획 (후속 Task)

1. ✅ **Upstash Redis 기반 rate limit** — Bearer 토큰 단위 분당 100건 상한 (Task 2-M-B-3-A **완료**, Session #23)
2. ✅ **Supabase alert 실제 설정** — pg_cron + pg_net + Vault + Telegram (Task 2-M-B-3-B **완료**, Session #25). 구현: `supabase/migrations/007_notify_rate_limit_spike.sql`
3. **IP allowlist (선택)** — n8n instance 고정 IP가 있다면 추가 방어 계층
4. **토큰 prefix 분리** — `nlog_` 같은 prefix로 로그에 토큰 노출 시 즉시 식별 가능
5. **request 메트릭** — 성공률/지연/실패 이유 집계 (별도 /admin/events 대시보드)
6. **쿨다운 interval 여유 추가** — 현재 함수 `v_cooldown_interval := '5 minutes'` → `'5 minutes 5 seconds'` (cron jitter 경계 리스크 제거). learnings Session #25 #3 참조

### ✅ 완료된 V1 항목
- **Zero-downtime rotation** (Task 4, Session #20) — PRIMARY/SECONDARY 이중 시크릿 지원. 위 "Zero-downtime rotation 절차" 섹션 참조.
- **Rate limiting** (Task 2-M-B-3-A, Session #23) — Upstash Redis + `@upstash/ratelimit` sliding window. 토큰 SHA-256 해시를 key로 사용(원본 미저장). env 부재 시 no-op, Redis 장애 시 fail-open. 구현: `src/lib/monitoring/log-event-ratelimit.ts`.
- **Rate limit spike 알림** (Task 2-M-B-3-B, Session #25) — pg_cron 매 분 + pg_net + Vault + Telegram. 분당 50건 초과 시 한국어 알림, 쿨다운 5분. DB 내부 완결 (외부 의존 0). 구현: `supabase/migrations/007_notify_rate_limit_spike.sql`.

## 장애 대응

### 증상: `/admin/events`에 n8n 이벤트가 안 들어옴

```
1. Vercel Logs에서 `[log-event API]` prefix 검색
2. "INTERNAL_LOG_EVENT_SECRET_PRIMARY 환경변수 문제" → 환경변수 누락/변경 확인
3. "Zod 검증 실패" → n8n에서 보내는 페이로드 shape가 스키마와 불일치
4. "JSON 파싱 실패" → n8n Content-Type / body 인코딩 점검
5. 모두 해당 없음 → Supabase RLS / service_role key 상태 확인
```

### 증상: 401 Unauthorized가 반복됨

```
1. n8n Credential의 Authorization 헤더 값이 "Bearer <secret>" 형태인지 확인
   (Bearer 뒤 공백 1칸 필수)
2. Vercel env의 INTERNAL_LOG_EVENT_SECRET_PRIMARY 값과 n8n 값이 완전히 일치하는지
   (줄바꿈/공백 오염 주의)
3. rotation 진행 중이라면 SECONDARY도 설정되어 있는지 확인 — 구 토큰을 쓰는
   호출자가 아직 있으면 SECONDARY가 그 값이어야 함
4. Vercel Production 배포가 환경변수 변경 이후에 재배포되었는지 확인
```

### 증상: 500 Internal Server Error가 반복됨

```
1. Vercel Logs에서 `getInternalLogEventEnv` 에러 메시지 검색
2. Supabase `createAdminClient` 관련 에러 (service_role key 문제)
3. logEvent 내부의 `insert failed` 로그 (RLS/FK 제약)
```

### 증상: 429 Too Many Requests가 반복됨

```
1. Supabase pipeline_events 테이블에서 최근 10분 내
   step = 'rate_limit_exceeded' row 집계:
   SELECT COUNT(*), MIN(created_at), MAX(created_at)
   FROM pipeline_events
   WHERE step = 'rate_limit_exceeded'
     AND created_at > NOW() - INTERVAL '10 minutes';
2. 1분당 100건 초과 → 정상 호출자라면 호출 주기 문제(n8n 루프),
   이상 호출자라면 **🚨 토큰 유출 의심** → 즉시 긴급 rotation 절차 실행
   (위 "긴급 rotation (compromised)" 섹션)
3. Vercel Logs의 `[log-event ratelimit]` prefix로 Redis 장애 여부 확인 —
   "Redis 호출 실패" 메시지가 있으면 Upstash 상태 페이지 점검.
   Redis 장애 중에는 fail-open으로 통과하므로 429가 아닌 200 응답.
```

## 관련 파일

- `src/app/api/v1/internal/log-event/route.ts` — 엔드포인트 구현
- `src/lib/env.ts` — `getInternalLogEventEnv()` 환경변수 스키마
- `src/lib/monitoring/log-event.ts` — 호출 체인의 최종 insert 헬퍼
- `supabase/migrations/006_pipeline_events.sql` — 테이블 + RLS
- `docs/n8n-workflows/test-log-event.sh` — 수동 검증 curl 스크립트 ⚠️ **gitignore 대상** (`docs/n8n-workflows/` 폴더 전체가 "may contain secrets" 이유로 .gitignore). 아래 "부록: 테스트 스크립트 템플릿"을 복사하여 로컬에 직접 생성

---

## 부록: 테스트 스크립트 템플릿

`docs/n8n-workflows/`가 gitignore 대상이라 `test-log-event.sh`는 저장소에
커밋되지 않는다. 새 환경에서 검증이 필요하면 아래 스니펫을 복사해
`docs/n8n-workflows/test-log-event.sh`로 저장하고 `chmod +x` 후 실행:

```bash
#!/usr/bin/env bash
#
# test-log-event.sh — POST /api/v1/internal/log-event 수동 검증
#
# 전제:
#   1. pnpm dev (포트 3800) 기동
#   2. .env.local에 INTERNAL_LOG_EVENT_SECRET_PRIMARY 설정 (openssl rand -hex 32)
#   3. 이 스크립트 실행 전에 export INTERNAL_LOG_EVENT_SECRET_PRIMARY=<값>
#   (rotation 중이면 INTERNAL_LOG_EVENT_SECRET_SECONDARY 도 같이 테스트할 것)

set -euo pipefail

URL="http://localhost:3800/api/v1/internal/log-event"
TOKEN="${INTERNAL_LOG_EVENT_SECRET_PRIMARY:-REPLACE_ME_WITH_REAL_TOKEN}"

run_test() {
  local name=$1
  local out=$2
  shift 2
  echo "========================================"
  echo "$name"
  echo "========================================"
  curl -s -o "$out" -w "HTTP %{http_code}\n" "$@"
  cat "$out"
  echo
  echo
}

# Test 1: 인증 헤더 없음 → 401
run_test "Test 1: No Authorization → 401" /tmp/log-event-test1.json \
  -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"service":"n8n","level":"info","message":"test"}'

# Test 2: 틀린 Bearer → 401
run_test "Test 2: Wrong Bearer → 401" /tmp/log-event-test2.json \
  -X POST "$URL" \
  -H "Authorization: Bearer wrong-token-1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"service":"n8n","level":"info","message":"test"}'

# Test 3: 올바른 토큰 + valid body → 200
run_test "Test 3: Valid → 200" /tmp/log-event-test3.json \
  -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "n8n",
    "level": "info",
    "message": "test-log-event.sh Test 3 — valid payload",
    "step": "manual_test",
    "contextType": "test",
    "contextId": "manual-run-001"
  }'

# Test 4: level 누락 → 400
run_test "Test 4: Missing level → 400" /tmp/log-event-test4.json \
  -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service":"n8n","message":"missing level field"}'

# Test 5: message 2001자 → 400
LONG_MESSAGE=$(printf 'x%.0s' {1..2001})
run_test "Test 5: Message 2001 chars → 400" /tmp/log-event-test5.json \
  -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"service\":\"n8n\",\"level\":\"info\",\"message\":\"$LONG_MESSAGE\"}"

echo "========================================"
echo "✓ 완료 — Supabase MCP로 Test 3 row 확인"
echo "========================================"
```

실행:
```bash
export INTERNAL_LOG_EVENT_SECRET_PRIMARY=$(grep INTERNAL_LOG_EVENT_SECRET_PRIMARY .env.local | cut -d= -f2)
bash docs/n8n-workflows/test-log-event.sh
```
