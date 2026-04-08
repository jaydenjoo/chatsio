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

| 이름 | 위치 | 생성 방법 | 비고 |
|---|---|---|---|
| `INTERNAL_LOG_EVENT_SECRET` | `.env.local` (로컬) | `openssl rand -hex 32` | 64자 hex |
| `INTERNAL_LOG_EVENT_SECRET` | Vercel Project Settings → Environment Variables (production) | 로컬과 동일 값 복사 | Preview/Production 모두 |
| n8n Credential | n8n instance → Credentials → HTTP Header Auth | Name: `Authorization` / Value: `Bearer <secret>` | Error Handler 노드에서 참조 |

**최소 길이 제약**: `src/lib/env.ts`의 `getInternalLogEventEnv()`가 32자 미만이면 throw → 엔드포인트가 500.

## 시크릿 Rotation 절차

rotation 시점: (1) 의심 사건 발생 / (2) 분기별 예방 rotation / (3) 팀원 off-boarding.

**순서 중요 — n8n을 먼저 바꾸면 프로덕션 에러 이벤트가 순간적으로 누락될 수 있음.**

```
1. openssl rand -hex 32 → 새 시크릿 생성
2. Vercel Preview 환경변수에 새 시크릿 저장 → Preview 배포에서 검증
3. Vercel Production 환경변수를 **구 시크릿 + 새 시크릿 둘 다 허용**하도록
   임시 브리지 상태로 두려면... 현재 구현은 단일 토큰 비교라 불가능.
   대신 아래 "Zero-downtime rotation" 섹션 참조.

## Zero-downtime rotation (현재 구현 기준)

현재 `constantTimeEquals`가 단일 `expectedToken`과 비교하므로 순간적 공백
없이는 rotate 불가능. 차선책:

a) **최소 공백 rotation** (권장):
   1. n8n을 새 시크릿 값으로 바꾸고 **임시 비활성화** (Active 토글 off)
   2. Vercel env 교체 → 자동 재배포 대기 (보통 1~2분)
   3. n8n 활성화 복구
   4. Supabase MCP로 `pipeline_events`에 rotation 창 동안 `n8n` service
      레벨 error 이벤트가 없는지 확인 (없어야 정상)

b) **완전 zero-downtime** (V2에서 구현):
   `INTERNAL_LOG_EVENT_SECRET_PRIMARY` + `INTERNAL_LOG_EVENT_SECRET_SECONDARY`
   둘 다 허용. 교체 순서:
     1. SECONDARY에 새 시크릿
     2. n8n을 새 시크릿으로 교체
     3. PRIMARY를 새 시크릿으로 덮어쓰기
     4. SECONDARY 제거
```

## Supabase Alert 권장 설정

rate limiting이 없는 MVP 상태에서 audit log flooding 공격 탐지용.

Supabase Dashboard → Database → Reports → Custom Alerts (또는 Logflare/Grafana):

```sql
-- 1분 윈도우 내 n8n 서비스 이벤트 수가 100건을 초과하면 알림
SELECT COUNT(*)
FROM pipeline_events
WHERE service = 'n8n'
  AND created_at > NOW() - INTERVAL '1 minute';
```

임계값 기준:
- 정상: 분당 한 자릿수~십몇 건 (실패한 optimization run마다 수 개)
- 주의: 분당 100건 초과 → 대량 실패 또는 flooding 의심
- 위험: 분당 1000건 초과 → 즉시 토큰 rotation + n8n 노드 비활성화

## V2 계획 (후속 Task)

현재 MVP는 rate limiting이 없다. 🔴 등급 프로젝트의 감사 로그 보호를 위해
아래 항목을 다음 sprint에 추가 예정:

1. **Upstash Redis 기반 rate limit** — Bearer 토큰 단위 분당 100건 상한
2. **IP allowlist (선택)** — n8n instance 고정 IP가 있다면 추가 방어 계층
3. **Zero-downtime rotation** — PRIMARY/SECONDARY 이중 시크릿 지원
4. **토큰 prefix 분리** — `nlog_` 같은 prefix로 로그에 토큰 노출 시 즉시 식별 가능
5. **request 메트릭** — 성공률/지연/실패 이유 집계 (별도 /admin/events 대시보드)

## 장애 대응

### 증상: `/admin/events`에 n8n 이벤트가 안 들어옴

```
1. Vercel Logs에서 `[log-event API]` prefix 검색
2. "INTERNAL_LOG_EVENT_SECRET 환경변수 문제" → 환경변수 누락/변경 확인
3. "Zod 검증 실패" → n8n에서 보내는 페이로드 shape가 스키마와 불일치
4. "JSON 파싱 실패" → n8n Content-Type / body 인코딩 점검
5. 모두 해당 없음 → Supabase RLS / service_role key 상태 확인
```

### 증상: 401 Unauthorized가 반복됨

```
1. n8n Credential의 Authorization 헤더 값이 "Bearer <secret>" 형태인지 확인
   (Bearer 뒤 공백 1칸 필수)
2. Vercel env의 INTERNAL_LOG_EVENT_SECRET 값과 n8n 값이 완전히 일치하는지
   (줄바꿈/공백 오염 주의)
3. Vercel Production 배포가 환경변수 변경 이후에 재배포되었는지 확인
```

### 증상: 500 Internal Server Error가 반복됨

```
1. Vercel Logs에서 `getInternalLogEventEnv` 에러 메시지 검색
2. Supabase `createAdminClient` 관련 에러 (service_role key 문제)
3. logEvent 내부의 `insert failed` 로그 (RLS/FK 제약)
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
#   2. .env.local에 INTERNAL_LOG_EVENT_SECRET 설정 (openssl rand -hex 32)
#   3. 이 스크립트 실행 전에 export INTERNAL_LOG_EVENT_SECRET=<값>

set -euo pipefail

URL="http://localhost:3800/api/v1/internal/log-event"
TOKEN="${INTERNAL_LOG_EVENT_SECRET:-REPLACE_ME_WITH_REAL_TOKEN}"

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
export INTERNAL_LOG_EVENT_SECRET=$(cat .env.local | grep INTERNAL_LOG_EVENT_SECRET | cut -d= -f2)
bash docs/n8n-workflows/test-log-event.sh
```
