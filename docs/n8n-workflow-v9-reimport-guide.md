# n8n Workflow V9 재임포트 가이드 (Session #32)

> Session #31 → #32. n8n "Chatsio V8" Silent Failure 근본 해결.
> V9는 V8의 구조적 결함 3가지를 수정하고 Silent Failure 방어선 2개를 추가한 버전.

## Part 1. 왜 V9인가 — Silent Failure 진짜 원인

### 증상 (Session #31 관찰)
- n8n Executions: "Succeeded in 23.27s" ✅
- Supabase `optimizations`: `status=processing, result_json=null, jsonld=null, score=null, processing_step=3`
- UI: 무한 로딩

### 진짜 원인 (Session #32 정적 분석 확정)

**구조적 결함**: `autoMapInputData` + 직전 노드가 DB UPDATE 노드.

```
Premium: … → P7.최종정리 → Premium PStep3 (DB UPDATE) → P8.DB저장 (autoMapInputData)
Basic:   … → B2.최종정리 → Basic Step3   (DB UPDATE) → B3.DB저장 (autoMapInputData)
```

**무슨 일이 일어나는가**:
1. P7/B2가 result_json, jsonld, score, duration_ms를 계산하여 output으로 반환
2. 다음 노드(Premium PStep3/Basic Step3)가 DB UPDATE를 실행 — output은 **UPDATE된 DB row** (processing_step=3, result_json=null 상태)
3. P8/B3가 `$input.item.json`을 받음 → **이 값은 P7/B2 결과가 아니라 DB row**
4. P8/B3의 `autoMapInputData`는 input의 모든 필드를 UPDATE → **null 값으로 DB를 다시 UPDATE**
5. **P7/B2가 만든 결과물이 완전히 무시됨**
6. n8n은 workflow 전체가 에러 없이 끝났으므로 "Succeeded" 표시

한마디로: **P8/B3이 직전 DB row를 다시 DB에 덮어쓰는 짓을 하고 있었다**. `autoMapInputData`가 어떤 input을 받는지 몰라서 생긴 구조적 결함.

### 추가로 발견된 버그 2개

**버그 A**: B2.최종정리 / P7.최종정리 Code에서 `processing_step: 4`, `error_step: null`, `failed_at: null`이 `result_json` JSONB **내부**로 잘못 들여쓰기되어 포함됨 → 테이블 컬럼 반영 안 됨.

**버그 B**: B2.최종정리가 `$input`으로 Claude 응답을 파싱하려 함. 하지만 중간에 Basic Step2(DB UPDATE)가 있어서 `$input` = DB row. **B2는 Claude 응답을 읽지 못하고 빈 resultJson을 만들었다**. (P7은 `$('P6. 품질 검수')`로 직접 참조 → 영향 없음)

---

## Part 2. V8 → V9 변경 사항 (7가지)

| # | 변경 | 대상 | 이유 |
|---|---|---|---|
| 1 | workflow name V8 → V9 | `"name"` 필드 | 새 workflow로 임포트 (V8과 구분) |
| 2 | `optimization_id` 필드 추가 + 검증 | `1. 데이터 정규화` | PK 기반 WHERE 매칭용. idempotency_key보다 안전 |
| 3 | `$input` → `$('B1. AI 최적화')` | `B2. 최종 정리` | 버그 B 수정. Claude 응답 직접 참조 |
| 4 | result_json 밖으로 이동 | `B2` / `P7. 최종 정리` | 버그 A 수정. processing_step/error_step/failed_at 제거 |
| 5 | `autoMapInputData` → `defineBelow` | `B3` / `P8. DB 저장` | 진짜 원인 해결. 명시적 컬럼 + 직접 참조 |
| 6 | 새 노드 `B3 검증` / `P8 검증` | 신규 IF 노드 | Silent Failure 방어선 1: UPDATE가 row 반환했는지 검증 |
| 7 | 새 노드 `Mark Failed` | 신규 Supabase UPDATE | Silent Failure 방어선 2: 검증 실패 시 status=failed 기록 |

### B3/P8 DB 저장 상세 변경

**V8**:
```
filter: idempotency_key eq {{ $json.idempotency_key }}  # $json = DB row
dataToSend: autoMapInputData  # 모든 input 필드 (= DB row) 다시 UPDATE
```

**V9**:
```
filter: id eq {{ $('1. 데이터 정규화').first().json.optimization_id }}  # PK 기반
dataToSend: defineBelow
fields:
  - status = 'completed'
  - result_json = {{ $('B2. 최종 정리').item.json.result_json }}   # P8은 P7 참조
  - jsonld     = {{ $('B2. 최종 정리').item.json.jsonld }}
  - score      = {{ $('B2. 최종 정리').item.json.score }}
  - duration_ms= {{ $('B2. 최종 정리').item.json.duration_ms }}
  - processing_step = 4
  - updated_at = {{ $now.toISO() }}  # 트리거 없으므로 명시적 세팅
```

### 새 흐름 (Basic)
```
Basic Step3 (processing_step=3 UPDATE)
  → B3. DB 저장 (completed UPDATE with defineBelow)
  → B3 검증 (IF: $json.id notEmpty?)
       true  → 종료 (성공)
       false → Mark Failed (status=failed)
```

### 새 흐름 (Premium)
```
Premium PStep3 (processing_step=3 UPDATE)
  → P8. DB 저장 (completed UPDATE with defineBelow)
  → P8 검증 (IF: $json.id notEmpty?)
       true  → 종료 (성공)
       false → Mark Failed (status=failed)
```

---

## Part 3. 코드베이스 변경 (Claude가 수정 완료)

### 3-1. `src/lib/n8n/payload.ts`
`N8nOptimizationPayload` 인터페이스에 `optimization_id: string` 필드 추가. `BuildN8nPayloadInput`에도 `optimizationId: string`. `buildN8nPayload`가 payload 첫 필드로 `optimization_id` 매핑.

### 3-2. `src/features/optimize/actions.ts`
`invokeN8nWebhook` 호출 시 `buildN8nPayload`에 `optimizationId` 전달. 값은 line 297의 `const optimizationId = inserted.id;`.

### 3-3. `docs/n8n-workflows/Chatsio V9 - Claude Sonnet + Opus (Basic + Premium).json`
V8 백업 그대로 유지 + V9 신규 파일 생성. 30 nodes, 29 connections, 모든 JSON 유효성 + typecheck 통과.

---

## Part 4. Jayden 재임포트 절차

### 🔴 중요: n8n credential 사전 확인

재임포트 전에 **반드시** 확인:
- n8n → Credentials → "Supabase account" 열기
- **Service Role Secret** 필드가 채워져 있어야 함 (anon key 아님)
- Service Role Secret은 Supabase Dashboard → Project Settings → API → `service_role` 값
- anon key면 RLS 때문에 다른 에러가 날 수 있음

### 절차

1. **V8 workflow 비활성화** (삭제 아님, 백업)
   - n8n → Workflows → "Chatsio V8 - Claude Sonnet + Opus (Basic + Premium)" 열기
   - 우측 상단 "Active" 토글 **OFF**
   - 삭제하지 말 것 — V9 문제 발생 시 rollback 용도

2. **V9 임포트**
   - n8n → Workflows → 우측 상단 `+` → **Import from File**
   - 파일 선택: `docs/n8n-workflows/Chatsio V9 - Silent Failure Fix (Basic + Premium).json`
   - ⚠️ 파일명은 `Chatsio V9 - Claude Sonnet + Opus (Basic + Premium).json`이지만 workflow 내부 name은 `Chatsio V9 - Silent Failure Fix (Basic + Premium)`
   - Import 완료 후 새 workflow 열림

3. **Credential 재연결 확인**
   - 각 노드에서 **빨간 느낌표**가 없는지 확인
   - 느낌표 있으면 해당 노드 클릭 → Credentials 드롭다운에서 기존 "Supabase account" 또는 "Anthropic account" 선택
   - 특히 확인 필요한 노드: `Mark Failed` (신규), `B3 검증` / `P8 검증` (credential 없음 — IF 노드)

4. **Webhook URL 확인**
   - Webhook 노드 클릭 → **Production URL 복사**
   - V8과 **같은 URL인지 확인**. 다르면 환경변수 `N8N_WEBHOOK_URL` 업데이트 필요
   - elest.io 환경에서는 `https://<instance>.vm.elestio.app/webhook/chatsio-optimize` 형식
   - **다른 URL이라면 Vercel 환경변수도 업데이트 필요** (프로덕션 재배포 필요)

5. **V9 활성화**
   - 우측 상단 "Active" 토글 **ON**

6. **Dry run (선택, 권장)**
   - n8n → V9 workflow → Execute Workflow 버튼
   - Webhook이 manual test mode로 리스닝 → 아래 curl로 테스트 payload 전송:

   ```bash
   # 환경변수를 먼저 세팅한 뒤 실행
   export N8N_URL="https://your-instance.vm.elestio.app"
   export N8N_SECRET="your-webhook-secret-from-env"

   curl -X POST "$N8N_URL/webhook-test/chatsio-optimize" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $N8N_SECRET" \
     -d '{
       "optimization_id": "00000000-0000-0000-0000-000000000001",
       "order_id": "test-key-1",
       "idempotency_key": "test-key-1",
       "product_id": "00000000-0000-0000-0000-000000000002",
       "shop_id": "00000000-0000-0000-0000-000000000003",
       "plan": "basic",
       "product_name": "테스트 상품",
       "product_url": "https://example.com/p/1",
       "image_urls": [],
       "source": "manual-test",
       "industry": "fashion",
       "brand": "",
       "category": "",
       "original_price": null,
       "discount_price": null
     }'
   ```

   - 결과: n8n에서 workflow가 실행되고 `B3 검증`에서 **false branch → Mark Failed**로 가는 게 정상. 이유: test uuid `00000000-...`는 optimizations 테이블에 실제로 없음 → B3. DB 저장이 0 rows → B3 검증 실패 → Mark Failed도 0 rows → 어쨌든 workflow 전체는 정상 실행
   - **핵심**: n8n Executions에서 `B3. DB 저장` 노드 input/output을 눌러 **id 기반 filter**로 변경됐는지 + `defineBelow` 필드 7개가 정확히 들어가는지 육안 확인

7. **실제 테스트는 Part 5 참조**

---

## Part 5. 재테스트 체크리스트 (V9 실제 검증)

### 사전 조건
- V9 활성화 완료
- Vercel 최신 배포 완료 (actions.ts + payload.ts 변경 포함)
- Anthropic API 잔액 >$0.10 (Basic 1회 + Premium 1회 분량)

### 테스트 1: Basic 플랜 실데이터

1. Jayden 본인 브라우저 로그인 → `/optimizations/new` 또는 상품 상세에서 "최적화" 버튼
2. Basic 플랜 선택 → 실행
3. **예상 소요**: 30~60초
4. **UI가 `completed` 상태로 전환되어야 함**

### 검증 SQL (Supabase SQL Editor)

```sql
-- 방금 만든 최적화 row 확인
SELECT
  id,
  plan,
  status,
  processing_step,
  error_step,
  error_message,
  CASE WHEN result_json IS NOT NULL THEN 'HAS' ELSE 'NULL' END AS result_json_status,
  CASE WHEN jsonld IS NOT NULL THEN 'HAS' ELSE 'NULL' END AS jsonld_status,
  score,
  duration_ms,
  updated_at
FROM optimizations
WHERE shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
ORDER BY created_at DESC
LIMIT 3;
```

**기대 결과**:
- `status = 'completed'` ✅
- `processing_step = 4` ✅
- `error_step` / `error_message` = null ✅
- `result_json_status = 'HAS'` ✅
- `jsonld_status = 'HAS'` ✅
- `score > 0` ✅
- `duration_ms > 0` ✅
- `updated_at > created_at` ✅ (트리거 없어도 V9가 명시적으로 now() 세팅)

### Task 2-6 CompletedView 검증

실제 결과 페이지에서:
- [ ] `QualityScoreRing` — 품질 점수(0~100) 원형 게이지 표시
- [ ] `AttributeList` — `result_json` 필드들이 27개 한글 라벨로 표시
- [ ] `JsonldPreview` — "JSON-LD 코드" 탭에서 Schema.org Product 객체 확인
- [ ] "복사" 버튼 작동
- [ ] "Google Rich Results Test" 외부 링크 카드 표시

### 테스트 2: Premium 플랜 (선택)

같은 상품 또는 다른 상품으로 Premium 플랜 실행. 예상 1분 30초 ~ 2분.

---

## Part 6. 실패 시 디버깅

### 시나리오 A: V9가 Silent Failure 대신 **명시적 failed**로 전환

V9의 **핵심 방어선**이 작동한 것. Mark Failed가 실행되면:
- DB: `status=failed`, `error_step=db_save_verification_failed`, `error_message=최종 UPDATE 검증 실패: B3/P8 Supabase 노드가 0 rows 반환. n8n Executions에서 상세 확인 필요.`
- UI: FailedView 자동 전환

**다음 단계**: n8n Executions에서 해당 실행 열기 → `B3. DB 저장` 또는 `P8. DB 저장` 노드 클릭 → **INPUT 탭**과 **OUTPUT 탭** 스크린샷. 스크린샷을 Claude에 공유 → 실제 원인 분석.

### 시나리오 B: `optimization_id is required` 에러

`1. 데이터 정규화` 노드에서 throw. 원인: webhook body에 `optimization_id` 없음.

**확인**:
```bash
# actions.ts 변경 배포 확인
grep -A 2 "invokeN8nWebhook" src/features/optimize/actions.ts | head
# buildN8nPayload 내부 확인
grep "optimization_id" src/lib/n8n/payload.ts
```

**해결**: Vercel에 최신 코드 배포. `optimizationId` 필드 누락이 원인이면 payload.ts 수정본을 다시 배포.

### 시나리오 C: `B2: Claude API 응답 파싱 실패` 에러

B2 코드의 명시적 throw. 원인: B1. AI 최적화 HTTP 호출이 실패했거나 비정상 응답.

**확인**:
- n8n Executions → `B1. AI 최적화` 노드 OUTPUT → Anthropic 응답 내용
- Anthropic 잔액 확인
- Claude API rate limit 확인

### 시나리오 D: n8n workflow가 "Failed"로 표시

B1~P6 HTTP 호출 중 하나 실패. 이건 V9 범위 밖 (Phase 3에서 포괄 Error Trigger 추가 예정).

**현재 대응**: n8n Executions에서 실패 노드 확인 후 수동 판단.

---

## Part 7. 롤백 절차

V9에서 심각한 문제 발생 시:

1. V9 비활성화 (Active 토글 OFF)
2. V8 재활성화 (Active 토글 ON)
3. `git revert` 또는 수동 rollback:
   - `src/lib/n8n/payload.ts` — `optimization_id` 필드 제거
   - `src/features/optimize/actions.ts` — `optimizationId` 전달 제거
4. Vercel 재배포
5. Session #32 진단부터 재시작

**백업 파일 보존**:
- `docs/n8n-workflows/Chatsio V8 - Claude Sonnet + Opus (Basic + Premium).json` (V8 원본 — 삭제 금지)
- `docs/n8n-workflows/Chatsio V9 - Claude Sonnet + Opus (Basic + Premium).json` (V9 신규)

---

## Part 8. 만들지 않은 것 (의도적 미포함)

- ❌ HTTP 노드(B1, P1~P4, P6) 실패에 대한 포괄 Error Trigger → Phase 3
- ❌ `updated_at` 자동 갱신 트리거 migration → Session #31 learnings에 기록, 별도 Task
- ❌ Task 2-7 결과 수동 편집 / 2-8 이력 페이지 / 2-9 llms.txt → Phase 2 Task 목록 유지
- ❌ Supabase Edge Function으로 이전 (개선안 B) → 지금은 인프라 확장 불필요

## Part 9. 진짜 원인 확정 여부

**정적 분석 결론**: autoMapInputData + 직전 DB UPDATE 노드 구조 결함.

**100% 확신인가?**: 90%. 완벽한 확신은 n8n Executions 실행 로그의 실제 노드별 input/output 데이터를 봐야 가능. 하지만:
1. 이 결함만으로도 증상 100% 설명 가능
2. V9는 이 결함을 해결
3. V9 방어선(B3/P8 검증 + Mark Failed)은 **원인이 무엇이든** 실패를 DB에 명시적 기록

즉 가설이 틀렸어도 V9는 "실패 시 명시적 failed 기록" → 원인이 드러나 다음 사이클에서 해결 가능.

---

**작성**: Session #32 (2026-04-09)
**Claude Model**: Opus 4.6 (1M context)
**검증**: Python JSON validator + pnpm typecheck 통과
