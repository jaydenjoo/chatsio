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
| n8n Credential | n8n instance → Credentials → HTTP Header Auth | Name: `Authorization` / Value: `Bearer <secret>` | n8n 호출 시 PRIMARY 값 사용 | Error Handler 노드에서 참조 |

**최소 길이 제약**: `src/lib/env.ts`의 `getInternalLogEventEnv()`가 PRIMARY 32자 미만 또는 누락 시 throw → 엔드포인트가 500. SECONDARY는 설정될 때만 32자 이상 검증.

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

1. **Upstash Redis 기반 rate limit** — Bearer 토큰 단위 분당 100건 상한 (Task 2-M-B-3-A 예정)
2. **Supabase alert 실제 설정** — 위 SQL을 Dashboard에 등록 (Jayden 수동)
3. **IP allowlist (선택)** — n8n instance 고정 IP가 있다면 추가 방어 계층
4. **토큰 prefix 분리** — `nlog_` 같은 prefix로 로그에 토큰 노출 시 즉시 식별 가능
5. **request 메트릭** — 성공률/지연/실패 이유 집계 (별도 /admin/events 대시보드)

### ✅ 완료된 V1 항목
- **Zero-downtime rotation** (Task 4, 커밋 예정) — PRIMARY/SECONDARY 이중 시크릿 지원. 위 "Zero-downtime rotation 절차" 섹션 참조.

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
