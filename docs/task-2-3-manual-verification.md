# Task 2-3 수동 검증 가이드

> 작성: Session #31 (2026-04-09)
> 대상 Task: **Phase 2 / Task 2-3 — 최적화 실행 페이지 (상품 선택 → 플랜 선택 → 실행)**
> 대상 수행자: **Jayden (본인 브라우저)**
> 예상 소요: **5~10분** (Basic 플랜 기준)
> 예상 비용: **Anthropic ~$0.05** (Basic 1건)

---

## 1. 왜 수동 검증이 필요한가

Session #30에서 Playwright MCP로 E2E 스모크를 시도했으나 다음 이슈로 중단됨:

1. Playwright MCP의 persistent browser context가 **이전 세션 테스트 유저**로 로그인된 상태 → 해당 유저는 shop/products가 전혀 없어 "기존 상품 선택" 시나리오 즉시 불가
2. Jayden 메인 계정으로 재로그인 시도 → **Google OAuth bot 감지 위험** (Session #28 learnings에서 규칙화됨)
3. 온보딩 전체 진행 + 더미 상품 등록 옵션 → 30분+ 소요 + 더미 상품은 검증 가치 낮음

→ **결론**: Jayden 본인 브라우저에서 직접 1건 실행 → 스크린샷으로 결과 공유가 최소 비용 · 최대 확신.

Phase 2 실행 파이프라인 코어는 코드 리뷰상 100% 완성으로 판정됐으나, **실제 n8n 왕복 + Claude API 호출 + DB 저장이 현 환경에서 작동**하는지는 실행 검증이 없으면 확신 불가.

---

## 2. 사전 조건 체크리스트

실행 전 아래를 확인하세요. 하나라도 ❌면 먼저 해결 후 진행.

- [ ] **로그인 상태**: Jayden 메인 계정으로 `chatsio-topaz.vercel.app` 로그인 완료
- [ ] **활성 shop 존재**: 사이드바에 쇼핑몰 정보가 표시됨 (온보딩 완료 상태)
- [ ] **상품 최소 1개 등록**: `/products`에서 상품 카드 1개 이상 보임
- [ ] **Anthropic 잔액**: $1 이상 (Session #29에서 충전 완료 확인됨 — 보통 그대로 사용 가능)
- [ ] **최근 5분 내 동일 상품으로 최적화 실행 이력 없음** (중복 방지 로직에 걸리지 않도록)

> 💡 **Tip**: 상품이 없다면 가장 간단한 상품 1개(실제 본인 쇼핑몰 URL)를 `/products/new`에서 추가하고 시작하세요. 더미가 아닌 **실제 상품**이어야 AI 결과 품질도 함께 확인 가능합니다.

---

## 3. 실행 순서 (6단계)

### Step 1. 최적화 페이지 진입
- URL: `https://chatsio-topaz.vercel.app/optimize`
- 또는 사이드바 → "AI 최적화" 메뉴

**기대 상태**
- 페이지 헤더: **"AI 최적화 실행"**
- 설명: "상품과 플랜을 선택하면 AI가 검색 최적화 데이터를 생성합니다."
- 1단계 섹션("최적화할 상품") + 2단계 섹션("최적화 플랜") 표시

**📸 스크린샷 ①**: 초기 진입 상태 전체 (섹션 1~2 + 실행 버튼 포함)

---

### Step 2. 상품 선택
- 1단계 섹션에서 검색창 또는 상품 카드 목록에서 상품 1개 선택
- 라디오 버튼이 체크되면서 해당 카드가 강조됨

**기대 상태**
- 선택한 카드에 선택 표시(테두리 하이라이트 또는 체크)
- 다른 카드는 선택 해제됨

---

### Step 3. 플랜 선택 — **Basic** 권장
- 2단계 섹션에서 **Basic** 선택 (기본값)
- **검증 목적이면 Basic만**. Premium은 비용 3~4배 + 시간 5배.

**기대 상태**
- Basic 카드에 선택 표시
- 예상 소요 시간 표시: **~35초** (코드상 `PLAN_ESTIMATED_SECONDS.basic = 35`)

---

### Step 4. 실행 버튼 클릭
- 페이지 하단 우측 **"최적화 실행"** 버튼 (그라디언트 배경 + Sparkles 아이콘)
- 클릭 직후 버튼 라벨이 **"요청 전송 중..."**으로 변경됨 (1~2초)

**기대 동작**
- Server Action `runOptimization` 실행 → Zod 검증 → 인증/소유권 → 5분 중복 체크 → idempotency_key 생성 → `optimizations` row INSERT → n8n webhook 호출 → 성공 시 `/optimize/{id}` 페이지로 자동 이동

**⚠️ 실패 케이스별 예상 UI**
| 상황 | 표시 |
|---|---|
| 5분 내 동일 상품 재실행 | 중복 다이얼로그 팝업 (이전 실행으로 이동 가능) |
| n8n 연결 실패 | 에러 배너 (빨간색) + 사용자 친화 메시지 |
| 인증/권한 오류 | 에러 배너 + 메시지 |

**📸 스크린샷 ②**: 실행 직후 `/optimize/{id}` 결과 페이지 진입 상태 (Progress UI 표시 중)

---

### Step 5. 진행 상황 관찰 (~35초)
- 결과 페이지(`/optimize/{id}`)에서 다음 UI 실시간 업데이트:

**4단계 프로그레스**
1. **상품 데이터 정규화**
2. **AI 최적화 처리** ← 가장 오래 걸림 (20~25초)
3. **결과 품질 검수**
4. **결과 저장**

**헤더**
- 회전하는 로더 아이콘
- "AI 최적화를 처리하고 있습니다"
- "약 N초 남음 · M초 경과" (1초마다 업데이트)
- 진행률 바 0% → 100%

**실시간 방식**
- 1차: Supabase Realtime (`postgres_changes`)
- 2차 fallback: 5초 폴링

---

### Step 6. 완료 확인
- 35~60초 후 상태가 **"completed"**로 전환
- 화면이 **CompletedView**로 자동 교체됨

**🟡 현재 표시 형태 (Task 2-6 개선 전)**
- raw JSON이 `<pre>` 태그로 그대로 노출됨 (읽기 어려움)
- 이건 **정상**입니다. Task 2-6에서 정식 UI로 교체 예정.
- 검증 목적: **JSON 안에 실제 데이터가 채워져 있는가**만 확인.

**확인 포인트**
- [ ] JSON 내부에 상품 속성 데이터 존재 (빈 객체 ❌)
- [ ] `@context`, `@type` 등 JSON-LD 필드 보임
- [ ] 한글 속성(브랜드, 소재, 색상 등)이 의미 있게 채워짐

**📸 스크린샷 ③**: CompletedView 전체 (raw JSON 포함)

---

## 4. 성공 판정 기준

아래 4가지 모두 ✅여야 Task 2-3 실제 작동 확인 완료:

- [ ] Step 1~4: 각 단계 UI가 정상 표시/동작
- [ ] Step 5: 프로그레스 UI가 실시간 업데이트되고 35~60초 내 완료
- [ ] Step 6: `completed` 상태 + JSON에 실제 AI 추출 데이터 존재
- [ ] 에러 없음 (에러 배너 미표시)

**1개라도 실패 시** → "실패 시 대응" 섹션 참고

---

## 5. 실패 시 대응

### 5-1. 에러 메시지가 표시된 경우
1. **📸 스크린샷 캡처**: 에러 배너 전체 (한글 메시지 + 가능하면 브라우저 devtools Network 탭도)
2. **쿨다운 중인지 확인**: "최근 5분 내에 이미 실행되었습니다" → Step 4에서 **다른 상품** 선택 후 재시도
3. **에러 메시지가 모호한 경우** (예: "최적화 요청 중 오류가 발생했습니다")
   - 브라우저 devtools → **Console 탭** 에러 로그 캡처
   - **Network 탭** → `runOptimization` 요청 응답 body 캡처

### 5-2. 프로그레스가 진행 안 되는 경우 (1분 이상 1단계에 머무름)
- n8n webhook 연결 실패 가능성
- 브라우저 devtools → Network 탭에서 **Supabase realtime WebSocket** 연결 상태 확인
- `optimization_id`를 복사해서 Jayden에게 공유 → Claude가 pipeline_events 테이블에서 로그 조회 가능

### 5-3. pipeline_events 테이블 조회 (Claude가 수행 가능)
- Session #31 이어지는 대화에서 `optimization_id`만 알려주면 Claude가 Supabase MCP로 로그 조회 → 어느 단계에서 실패했는지 진단

---

## 6. Jayden 보고 형식

검증 완료 후 아래 정보를 알려주세요:

### 성공 케이스
```
✅ Task 2-3 수동 검증 성공
- 상품: [상품명 또는 ID]
- 플랜: Basic
- 소요 시간: [N]초
- 스크린샷: ①, ②, ③ 공유
- 결과 JSON 품질: [양호 / 일부 부정확 / 이상함]
```

### 실패 케이스
```
❌ Task 2-3 수동 검증 실패
- 실패 단계: [Step 1~6 중 어디]
- 에러 메시지: [화면에 표시된 메시지]
- optimization_id: [URL에서 /optimize/{id}의 id, 있다면]
- 스크린샷: 실패 상태 + Console/Network 탭
```

---

## 7. 검증 완료 후 다음 단계

Jayden 보고 후 Claude는 다음을 수행:

1. **성공 시**: PROGRESS.md에 "Task 2-3 실제 작동 검증 완료" 기록 + Task 2-6 Plan으로 즉시 진입
2. **실패 시**: 실패 원인 진단 → learnings.md 기록 → 수정 Plan 작성 → 재검증 순환

---

## 부록 — 참고 파일 (진단 시)

| 경로 | 역할 |
|---|---|
| `src/app/(dashboard)/optimize/page.tsx` | 최적화 실행 페이지 |
| `src/app/(dashboard)/optimize/[id]/page.tsx` | 결과/상태 페이지 |
| `src/features/optimize/actions.ts` | `runOptimization` Server Action |
| `src/features/optimize/components/optimize-form.tsx` | 폼 (상품+플랜 선택) |
| `src/features/optimize/components/optimization-progress.tsx` | 진행 UI (4단계) |
| `src/features/optimize/components/optimization-status.tsx` | Realtime + 폴링 + CompletedView (🟡 임시) |
| `src/features/optimize/validation.ts` | `PLAN_ESTIMATED_SECONDS`, `PROCESSING_STEP_LABELS` |

**상호 참조**
- `docs/PROGRESS.md` Session #30 (이 검증이 왜 수동인지 맥락)
- `docs/learnings.md` Session #28 Google OAuth bot 감지 규칙
- `docs/PRD.md` Phase 2 완료 기준
