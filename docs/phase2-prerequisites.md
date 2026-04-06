# Phase 2 Prerequisites — AI 구조화 파이프라인 진입 전 체크리스트

> 작성일: 2026-04-06 (Session #12)
> 목적: Phase 2(Task 2-3 ~ 2-9) 코드 작업 시작 전, Jayden이 직접 처리해야 하는 외부 환경 준비 사항을 한 곳에 모은다.
> 다음 세션 시작 전 이 문서의 **모든 체크박스가 ✅** 되어야 Phase 2 코드 작업에 진입할 수 있다.

---

## 0. 이미 완료된 사전 작업 (Session #12)

이 항목들은 Session #12에서 우리가 끝냈다. Jayden이 다시 할 필요 없음.

- [x] **마이그레이션 003 적용 완료** — `optimizations.idempotency_key` UNIQUE 제약 + `llms_txt_versions` 테이블 + RLS 2개 정책
- [x] **DB 스키마 갭 결정** — `optimization_history` / `extraction_logs` / `cost_tracking` 흡수 또는 이연 결정
- [x] **로컬 마이그레이션 파일 저장** — `supabase/migrations/003_phase2_prerequisites.sql`

---

## 1. 환경변수 추가 — Jayden 직접 입력 필요

### 1-A. `.env.example` 갱신

`.env.example` 파일 끝에 아래 블록을 그대로 추가:

```bash

# ============================================================
# Phase 2: AI 구조화 파이프라인
# ============================================================

# n8n webhook (AI 분석 워크플로우)
# Elest.io 셀프호스팅 인스턴스의 webhook URL.
# 형식: https://<your-n8n-domain>/webhook/<path>
N8N_WEBHOOK_URL=https://your-n8n-domain.example.com/webhook/optimize

# n8n webhook 서명 검증용 시크릿 (HMAC-SHA256)
# 32바이트 이상 랜덤 문자열. n8n 워크플로우의 검증 노드와 동일 값 사용.
# 생성: openssl rand -hex 32
N8N_WEBHOOK_SECRET=replace_with_64_char_hex_string

# Anthropic API key (Claude Sonnet 4.6 직접 호출용 — 백업 경로)
# 주의: n8n 안에서 Claude를 호출하므로 일반적으로는 불필요.
# 다만 결과 보기 페이지에서 JSON-LD 재생성(Task 2-7) 같이
# Next.js 서버에서 직접 호출이 필요할 때 사용.
# 발급: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 1-B. `.env.local` 실제 값 입력

같은 키들을 `.env.local`에도 추가하고 **실제 값**을 입력.

| 변수 | 값 출처 | 형식 예시 |
|---|---|---|
| `N8N_WEBHOOK_URL` | Elest.io n8n 콘솔 → 워크플로우 → Webhook 노드 → "Production URL" 복사 | `https://chatsio-n8n.elest.io/webhook/optimize` |
| `N8N_WEBHOOK_SECRET` | `openssl rand -hex 32` 명령으로 생성, 같은 값을 n8n 워크플로우의 검증 노드 환경변수에도 설정 | 64자 hex 문자열 |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys 에서 발급 | `sk-ant-api03-`로 시작 |

### 1-C. 검증

`.env.local` 입력 후, 다음 세션 시작 시 이 명령으로 확인 (값이 출력되면 OK):

```bash
grep -c "N8N_WEBHOOK_URL=https" .env.local
grep -c "N8N_WEBHOOK_SECRET=." .env.local
grep -c "ANTHROPIC_API_KEY=sk-ant" .env.local
```

각 명령이 `1`을 출력해야 정상.

### Jayden 체크리스트

- [ ] `.env.example`에 위 블록 추가
- [ ] `.env.local`에 실제 값 3개 입력
- [ ] `grep -c` 검증 3개 모두 `1` 출력 확인

---

## 2. n8n 환경 점검 — Jayden 직접 확인

Phase 2 코드는 n8n webhook에 의존한다. n8n이 살아있지 않으면 Task 2-3 ~ 2-9 코드를 짜도 검증 불가.

### 2-A. Elest.io 인스턴스 살아있는지

- [ ] Elest.io 콘솔 접속 → Chatsio n8n 인스턴스 상태 `Running` 확인
- [ ] 마지막 재시작 후 24시간 이상 안정적으로 떠있음 (불안정하면 BullMQ 마이그레이션 검토를 앞당길 신호)

### 2-B. v8 워크플로우 import 상태

PRD 부록 B에 따르면 GPT-4o → Claude Sonnet 4.6 전환이 필요하다.

- [ ] n8n UI 접속 → 워크플로우 목록에 `v8` 또는 `chatsio-optimize-v8` 같은 이름의 워크플로우가 존재
- [ ] 해당 워크플로우가 **Active** 상태 (회색 X 표시 X)
- [ ] Webhook 노드의 "Production URL"이 `1-A` 환경변수와 일치
- [ ] HTTP Request 노드들이 `api.anthropic.com` 사용 (`api.openai.com`이면 아직 전환 안 된 것)
  - 만약 OpenAI 노드가 남아있다면 → **Task 2-1(n8n 프롬프트 Claude 전환)**이 별도로 필요. Phase 2 코드 작업과 병렬로 진행 가능하지만 끝나기 전엔 검증 불가.

### 2-C. webhook 살아있는지 (curl 테스트)

```bash
# 단순 핑 (404가 아니라 200 또는 401/403이면 webhook은 살아있음)
curl -i -X POST \
  -H "Content-Type: application/json" \
  -d '{"ping":true}' \
  "$(grep '^N8N_WEBHOOK_URL=' .env.local | cut -d= -f2-)"
```

기대 응답:
- `200` → webhook 살아있고 검증도 통과 (테스트 데이터라 워크플로우는 실패할 수 있음)
- `401`/`403` → webhook 살아있고 서명 검증이 작동 중 (정상)
- `404` → URL 잘못됨 또는 워크플로우 비활성. 1-B 다시 확인
- `Connection refused` / 타임아웃 → Elest.io 인스턴스 죽음. 2-A로 돌아가기

### 2-D. Anthropic API key 잔액 확인

- [ ] https://console.anthropic.com/settings/billing 접속
- [ ] 잔액 $10 이상 (Phase 2 검증 + 의류 50건 수동 검증 비용 여유)
- [ ] Usage limits에서 일/월 상한 설정 (오용/오류 시 폭주 방지) — 권장 일 $5

### 2-E. n8n 노드 안에 ANTHROPIC_API_KEY 설정

n8n HTTP Request 노드에서 Anthropic API를 호출하므로 n8n 환경변수에도 키가 있어야 한다.

- [ ] Elest.io n8n 인스턴스 → Settings → Environment Variables
- [ ] `ANTHROPIC_API_KEY` 키 존재 + 1-B와 동일한 값
- [ ] 변경 후 워크플로우 재시작 (변수는 재시작 시점에 로드됨)

### Jayden 체크리스트

- [ ] 2-A: Elest.io 인스턴스 Running
- [ ] 2-B: v8 워크플로우 Active + Anthropic 사용
- [ ] 2-C: curl 테스트 응답 200/401/403
- [ ] 2-D: Anthropic 잔액 + 일 상한 설정
- [ ] 2-E: n8n 환경변수 설정 + 재시작

---

## 3. Phase 2 본 작업 진입 조건

위 1·2 섹션의 **모든 체크박스가 ✅** 되면 다음 세션에서 곧바로 Task 2-3 (최적화 실행 페이지) 구현에 진입한다.

진입 시 첫 단계:
1. 새 세션 시작 → `/start`
2. 이 문서의 체크박스 상태 확인
3. 미체크 항목 있으면 → 그것부터 해결
4. 모두 ✅ → Task 2-3 Plan 작성 → Jayden 승인 → 구현

---

## 4. 만약 n8n이 아직 준비 안 됐다면 — 우회 경로

n8n 환경 준비가 1~2일 더 걸린다면, 그 시간을 쓸 수 있는 **n8n 의존 없는 Task**:

| Task | 설명 | n8n 의존 |
|---|---|---|
| Task 2-9 | llms.txt 자동 생성 | ❌ 없음 (DB 데이터만 사용) |
| Task 2-6 일부 | 결과 보기 페이지의 정적 UI 부분 (mock 데이터) | ❌ |
| Phase 4 일부 | 어드민 레이아웃, RBAC | ❌ |

이 우회 경로는 PRD의 의존 순서를 어기지 않는다 (모두 "데이터가 있을 때 동작" 조건이라, n8n 결과가 없어도 빈 상태/mock으로 UI 완성 가능).

**다만 권장 순서는 1·2 먼저 끝내고 Task 2-3부터 정공법으로 가는 것**이다. 우회 경로는 환경 준비가 정말 길어질 때만.
