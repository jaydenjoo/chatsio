# Chatsio V2 — PRD (Product Requirements Document)

**버전:** 2.0 Draft
**작성일:** 2026-04-05
**작성자:** PM (Claude) + Jayden (디렉터)
**보안 등급:** 🔴 보안 중요 (결제 + 고객 쇼핑몰 데이터 + OAuth 토큰 취급)
**상태:** CEO Review + Eng Review 완료 (2026-04-05)

---

## 1. Executive Summary

**한줄 정의:** 한국 중소 쇼핑몰이 상품 URL만 연결하면, AI가 상품정보를 자동 구조화(JSON-LD + llms.txt + 네이버 EP)하고, AI 검색엔진에 실제로 추천되는지 추적·증명해주는 상품 데이터 인프라 SaaS

**포지셔닝:** Chatsio = "상품 데이터 인프라". AI 인용은 첫 번째 use case. 네이버EP/구글리치결과/AI인용 = 모두 "구조화 데이터의 출력 포맷". AI 검색엔진이 이미지를 직접 읽게 되더라도, 구조화 데이터 자체의 가치(네이버EP, 구글 Rich Results)는 유지됨.

**배경:**
- AI 검색(ChatGPT, Perplexity, Google AI Overview)이 쇼핑 구매를 바꾸고 있다
- 한국 독립 쇼핑몰 8만개 중 구조화 데이터 적용은 사실상 0% — 방법 자체가 없음
- 글로벌엔 Profound, Zoovu 등 존재하나 영어권·대기업·고가 → 한국 중소몰 접근 불가
- chatsio는 이 빈자리를 채움: SKU 단위 구조화 + AI 인용 추적, 월 9.9만원부터

**핵심 성공 기준:**
1. 협약기간('26.06~'27.01) 내 파일럿 5개사 확보 + 유료 전환 시작
2. 의류 상품 속성 추출 정확도 95%+ 유지 (현재 검증 97.3%)

---

## 2. 문제 정의 (Problem Statement)

### 누가: 한국 중소 쇼핑몰 운영자 (직원 1~10명, 전담 개발자 없음)

### 무엇을:
AI 검색 시대에 "면 소재 오버핏 반팔 추천해줘"라고 물으면, 상품정보가 구조화된 쇼핑몰만 AI가 추천한다. 그러나 중소몰 상품정보의 70%+는 이미지 속에만 존재(사이즈표, 소재태그)하여 AI가 읽을 수 없다.

### 왜 힘든가:
1. 수작업 구조화: 상품 1개당 20~40분, 100개 기준 월 60시간 소요
2. 기술 장벽: JSON-LD, Schema.org, llms.txt — 비개발자가 할 수 없음
3. 비용 장벽: 에이전시 건당 1~3만원 (500개 기준 월 500~1,500만원)

### 기존 대안과 한계:

| 대안 | 한계 |
|------|------|
| 카페24 llms.txt | 쇼핑몰 '전체' 소개 수준, 개별 SKU 구조화 미제공 |
| Profound/Zoovu | 영어권, 대기업, 월 수백만원+, 한국어 미지원 |
| 직접 구현 | 전담 개발자 필요, 중소몰 현실에서 불가능 |
| SEO 에이전시 | GEO 전문성 부족, 건당 과금으로 비용 폭발 |

---

## 3. 타겟 사용자 (Personas)

### Primary: 이사장 (45세, 의류 쇼핑몰 대표, 직원 5명)
- **쇼핑몰:** 카페24 기반, 월 매출 3,000만원, 상품 200개
- **고통:** "네이버·구글 광고비만 월 500만원. AI 검색에서 우리 상품이 추천되면 광고비를 줄일 수 있을 텐데, 뭘 어떻게 해야 하는지 모르겠다"
- **기술 수준:** 카페24 어드민 사용 가능, HTML/코드 불가
- **돈 낼 의향:** 효과 증명되면 월 10~30만원 가능 (수요조사 N=25 중 64%)
- **핵심 요구:** "연결만 하면 알아서 해주는 서비스. 효과가 눈에 보여야 함"

### Secondary: 박마케터 (28세, 중소 쇼핑몰 주니어 마케터)
- **고통:** "대표님이 'AI 검색 최적화 해봐'라고 하셨는데 어디서 시작해야 하는지 모르겠다. 에이전시 예산 결재도 못 받는다"
- **기술 수준:** 구글 서치콘솔 기본 사용 가능
- **핵심 요구:** "보고서에 넣을 수 있는 Before/After 데이터"

---

## 4. 목표 & 성공 지표 (Goals & Outcome Metrics)

### 비즈니스 Outcome

| 지표 | 목표 | 측정 방법 | 시기 |
|------|------|----------|------|
| 파일럿 고객 | 5개사 | Supabase shops 테이블 | '26.09 |
| 유료 전환 | 파일럿 중 3개사 이상 | 결제 완료 | '26.12 |
| 1년 내 고객 | 50개사 | 앱스토어 + 직접 영업 | '27.06 |
| 연 매출 | 1.5억원 (50개사 × 월 25만원) | 결제 데이터 | '27.06 |
| CAC | 0원(초기 직접영업) → 15만원 이하(앱스토어) | 마케팅비/신규 | '27.01 |

### 사용자 Outcome

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 온보딩 완료율 | 80%+ (가입→첫 최적화) | 퍼널 분석 |
| 시간 절약 | 상품당 20~40분 → 2분 이하 | 최적화 소요시간 |
| 재사용률 | 월 2회+ 최적화 실행 | 액션 로그 |
| NPS | 40+ | 인앱 서베이 (파일럿 후) |

### AI-specific Outcome

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 속성 추출 정확도 | 95%+ (의류) | 수동 검증 100건 |
| JSON-LD Schema 유효성 | 100% | Google Rich Results Test API |
| AI 응답 시간 (n8n 파이프라인) | Basic < 30초, Premium < 90초 | n8n 실행 로그 |
| 환각률 | < 2% (사실과 다른 속성 생성) | 수동 검증 |
| AI 인용 추적 파싱 정확도 | 80%+ (PoC 단계) | 수동 대조 |

---

## 5. 핵심 기능 (Feature Scope — MoSCoW)

### Must Have (MVP — Phase 1~3에서 구현)

| # | 기능 | 설명 | Outcome 연결 |
|---|------|------|-------------|
| M1 | 인증 + 온보딩 | Supabase Auth (이메일+비밀번호 + 구글 소셜 로그인) + 4단계 위저드 (Welcome→쇼핑몰 연결→상품 선택→완료) | 온보딩 완료율 |
| M2 | 상품 관리 | URL 입력, 이미지 업로드, CSV 벌크업로드, 상품 목록 CRUD | 기본 UX |
| M3 | AI 최적화 실행 | n8n 웹훅 트리거 → Basic(1회 호출)/Premium(5-Agent) 분기 | 핵심 가치 |
| M4 | 결과 보기 + 편집 | 최적화 결과 확인, 속성 수동 수정, JSON-LD 미리보기 | 사용자 신뢰 |
| M5 | llms.txt 자동 생성 | 쇼핑몰 전체 정보 + 최적화된 상품 목록 → llms.txt 파일 생성 | 사업계획서 핵심 차별 |
| M6 | 배포 관리 | 코드 복사(수동), Loader JS(자동) 2가지 옵션 | 적용 허들 제거 |
| M7 | n8n 프롬프트 Claude 전환 | GPT-4o → Claude Sonnet 4.6 전환 + 의류 특화 프롬프트 | 한국어 품질 |
| M8 | 랜딩 페이지 | 디자인 시스템 v3.0 적용, 가치 전달 + CTA | 전환율 |
| M9 | 다크모드 | 시스템 설정 연동(prefers-color-scheme) + 수동 토글. 디자인 시스템 v3.0 다크 토큰 적용 | 사용자 경험 |
| M10 | 관리자(어드민) 대시보드 | Jayden(비개발자)이 Supabase 직접 조회 없이 서비스를 운영·모니터링할 수 있는 관리 인터페이스. 고객 관리, 최적화 현황, AI 비용, 프롬프트 관리, 시스템 상태를 한눈에 확인 | 운영 효율 |

### Should Have (Phase 5~6, CTO 합류 후)

| # | 기능 | 설명 | 우선순위 근거 |
|---|------|------|-------------|
| S1 | Cafe24 OAuth 연동 | 상품 자동 수집 + 선택 UI | 파일럿 허들 제거 |
| S2 | JSON-LD API 자동 적용 | ScriptTag API로 Loader JS 원클릭 설치 | 기술 허들 제거 |
| S3 | AI 인용 추적 시스템 | 질문 세트 자동 생성 → AI 플랫폼 질의 → Citation Score | 사업계획서 핵심 차별 |
| S4 | Before/After 리포트 | 적용 전/후 AI 인용 변화 대시보드 | 유료 전환 근거 |
| S5 | 업종별 프롬프트 (의류) | 의류 전용 프롬프트 세트 + 멀티모달 이미지 분석 | 정확도 향상 |
| S6 | 결제 시스템 | 토스페이먼츠 구독 결제 (Starter/Growth/Pro) | 매출 |
| S7 | 네이버 쇼핑 EP 자동 생성 | 추출된 구조화 데이터 → 네이버 EP 피드 자동 생성 | "오늘의 가치" — 즉시 매출 영향 |
| S8 | AI Readiness Score | 무료 진단 도구: 쇼핑몰 URL 입력 → AI 준비도 점수 | 무료→유료 전환 퍼널 |
| S9 | 주간 AI 리포트 | KakaoTalk/이메일로 최적화 현황 + AI 인용 변화 자동 발송 | 이탈 방지 |

### Could Have (Phase 7+, 기획자 합류 후)

| # | 기능 |
|---|------|
| C1 | 아임웹/고도몰 API 연동 (Cafe24 검증 후 순차 확장) |
| C2 | 식품/가구 업종 프롬프트 |
| C3 | 웹 카탈로그 (공개 상품 페이지) |
| C4 | AI 대화 시뮬레이터 (파일럿 고객 확보 후) |
| C5 | 경쟁자 AI 가시성 비교 (파일럿 고객 확보 후) |
| C6 | Schema.org 자동 검증 + 수정 제안 |
| C7 | 품질 검수 후 자동 재작업 루프 |
| C8 | 구글 머천트 센터 피드 생성 |
| C9 | 쿠팡/11번가 마켓플레이스 자동 등록 |

### Won't Have — Not Doing (명시적 제외)

| # | 제외 항목 | 이유 |
|---|----------|------|
| N1 | 모바일 앱 | 웹 대시보드 우선. 쇼핑몰 운영자는 PC 작업 |
| N2 | 네이버톡톡 연동 | 범위 초과 (단, 주간 리포트용 KakaoTalk Business API는 S9에서 구현) |
| N3 | 실시간 상담 기능 | chatsio는 상담 챗봇이 아님 |
| N4 | 다국어 지원 | 한국어만. 글로벌은 Phase 3+ |
| N5 | 자체 LLM 파인튜닝 | Claude API 활용. sLLM은 로드맵 Phase 2(1~2년 후) |
| N6 | A/B 테스트 기능 | 사용자가 직접 A/B 테스트할 기능 미구현 |
| N7 | 자동 크롤링 (URL 입력 없이) | Cafe24 API 연동이 이를 대체 |
| N8 | API 키 발급 (외부 개발자용) | Phase 3 이후 |
| N9 | 카카오 소셜 로그인 | 구글만 우선 지원. 카카오는 Phase 2 |
| N10 | 쇼핑몰 실시간 동기화 | Cafe24 webhook 또는 일일 1회 cron으로 가격/재고 동기화 (CEO Review 결정). 실시간은 서버 비용 과다 |
| N11 | 멀티모달 이미지 OCR (Phase 1) | Phase 1은 텍스트 기반만. 멀티모달은 S5에서 |

---

## 6. 만들지 않을 것 — 에이전트 사전 차단 (긍정문 경계)

AI 코딩 에이전트가 "합리적이라서" 추가할 법한 기능을 명시적으로 차단:

```
- 이 PRD에서 카카오 소셜 로그인을 구현하지 않는다. 구글 소셜 로그인만 지원한다.
- 이 PRD에서 사용자 역할은 admin과 member 2가지만 존재한다. 더 세분화된 권한 체계는 구현하지 않는다.
- 이 PRD에서 국제화(i18n)를 구현하지 않는다. 모든 UI 텍스트는 한국어 하드코딩이다.
- 이 PRD에서 웹소켓/실시간 업데이트를 구현하지 않는다. 폴링 또는 수동 새로고침을 사용한다.
- 이 PRD에서 이메일 알림을 구현하지 않는다. 인앱 상태 표시만 한다.
- 이 PRD에서 파일 업로드 시 이미지 리사이징/최적화를 구현하지 않는다. 원본 그대로 저장한다.
- 이 PRD에서 사용량 제한(rate limiting on user actions)을 구현하지 않는다. Phase 7의 결제 연동 시 구현한다.
- 이 PRD에서 상품 카테고리 자동 분류를 구현하지 않는다. 사용자가 업종을 직접 선택한다.
- 이 PRD에서 어드민 대시보드의 드래그 앤 드롭 위젯 재배치는 구현하지 않는다. 고정 레이아웃을 사용한다.
- 이 PRD에서 어드민용 별도 로그인 페이지를 만들지 않는다. 동일 로그인 후 역할에 따라 어드민 메뉴가 표시된다.
```

---

## 7. 사용자 플로우 (User Journey)

### 7-1. 핵심 여정 — Happy Path

```
① 가입 (30초)
   이메일+비밀번호 또는 구글 소셜 로그인 → Supabase Auth → 온보딩 시작

② 온보딩 (3분)
   Welcome → 쇼핑몰 정보 입력(이름, URL, 업종 선택, 플랫폼)
   → 상품 등록 방식 선택(URL 입력 / CSV 업로드 / Cafe24 연결*)
   → 첫 상품 1개 등록 → 완료
   * Cafe24 연결은 S1 구현 후

③ 첫 최적화 (2분 대기)
   상품 선택 → 플랜 선택(Basic/Premium) → "최적화 시작 →" 클릭
   → 로딩 UI (단계별 메시지: "상품 분석 중..." → "콘텐츠 작성 중..." → "품질 검수 중...")
   → 결과 화면 (JSON-LD 미리보기 + 속성 목록 + 점수)

④ 적용 (1분)
   "코드 복사" 버튼 → 쇼핑몰 상세페이지에 붙여넣기
   또는 "Loader 설치" (S2 구현 후) → 자동 적용

⑤ 효과 확인 (주 1회 자동)
   AI 인용 추적 (S3 구현 후) → Citation Score 변화 → Before/After 리포트
```

### 7-1b. CEO Review 추가 결정사항 (2026-04-05)

**에러 처리 3원칙:**
1. Vision AI 추출 실패 → 대시보드에 '수동확인필요' 상태 표시 + 알림
2. JSON-LD 주입 후 검증 — 실제 페이지를 크롤링해서 JSON-LD 존재 확인. Silent Failure 방지
3. 결제 후 추출 실패 → 자동재시도 2회 + 실패 시 전액환불

**필드별 품질 계층 (Codex 제안 수용):**
- **위험 필드** (가격, 성분, 재료): Cafe24 API에서 가져오기 우선. OCR은 fallback만. 오류 시 치명적(소비자 기만)
- **일반 필드** (설명, 브랜드, 소재): OCR 허용. 낮은 신뢰도도 수용 가능

**데이터 동기화 (Codex 제안 수용):**
- 가격/재고 변경 시 Cafe24 webhook으로 JSON-LD 자동 업데이트
- 또는 일일 1회 cron 동기화
- 오래된 가격 정보가 JSON-LD에 남으면 구글/네이버 페널티 위험

**엣지케이스:**
- 동일 쇼핑몰 중복 연결 방지 (unique constraint)
- 상품 10,000개+ 대량 처리: 구간별 과금 또는 월구독 전환
- Partial Failure (100개 중 30개 실패): 진행율 + 실패 목록 + 실패분만 재시도

**Supabase ↔ n8n 통신:** Next.js API Route에서 n8n webhook을 직접 호출 (가장 단순, 디버깅 용이)
**멱등성:** order_id 기반 idempotency key. n8n 워크플로우 시작 시 중복 체크

**n8n 스케일 마일스톤:** 50개 스토어 도달 시 BullMQ 등 전용 큐 시스템으로 마이그레이션 검토

### 7-2. Empty State 정의

| 화면 | Empty State |
|------|------------|
| 상품 목록 | "아직 등록된 상품이 없습니다" + 상품 추가 CTA + CSV 샘플 다운로드 |
| 최적화 결과 | "최적화를 실행하면 여기에 결과가 표시됩니다" + 최적화 시작 CTA |
| AI 인용 리포트 | "인용 추적을 시작하면 AI가 상품을 얼마나 추천하는지 확인할 수 있습니다" + 안내 |
| 배포 관리 | "최적화 완료 후 코드를 쇼핑몰에 적용해보세요" + 가이드 링크 |

### 7-3. 에러/예외 경로

| 상황 | 처리 |
|------|------|
| n8n 웹훅 타임아웃 (90초+) | "분석에 시간이 걸리고 있습니다. 잠시 후 결과 페이지에서 확인해주세요" → 비동기 저장 |
| n8n 웹훅 실패 (500) | "일시적 오류가 발생했습니다. 다시 시도해주세요" + 자동 재시도 1회 |
| 유효하지 않은 상품 URL | "이 URL에서 상품 정보를 찾을 수 없습니다. URL을 확인해주세요" |
| Claude API 장애 | "AI 분석 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요" |
| CSV 형식 오류 | "파일 형식이 맞지 않습니다" + 올바른 CSV 샘플 다운로드 제공 |
| 세션 만료 | 로그인 페이지로 리다이렉트 + "세션이 만료되었습니다. 다시 로그인해주세요" |

### 7-4. 관리자(어드민) 플로우 — 비개발자 운영 시나리오

Jayden(비개발자)이 Supabase SQL 콘솔 없이 서비스를 운영하기 위해 필요한 화면:

```
[어드민 홈] — /admin
  ├─ 서비스 현황 한눈에 보기
  │   ├ 총 고객 수 / 이번 주 신규 / 활성 고객
  │   ├ 총 최적화 건수 / 오늘 실행 / 성공률
  │   ├ AI API 비용 (이번 달 누적 / 일별 추이 차트)
  │   └ 시스템 상태 (n8n OK/에러, API 응답시간)
  │
  ├─ [고객 관리] — /admin/customers
  │   ├ 고객 목록 (가입일, 쇼핑몰명, 플랜, 상품수, 마지막 최적화일)
  │   ├ 고객 상세 (최적화 이력, 사용량, 결제 상태)
  │   └ 고객 메모 (파일럿 피드백 기록용)
  │
  ├─ [최적화 모니터링] — /admin/optimizations
  │   ├ 전체 최적화 실행 목록 (시간, 고객, 상품, 플랜, 상태, 소요시간)
  │   ├ 실패 건 필터 → 에러 원인 확인 → 재실행 버튼
  │   └ 일별/주별 실행 통계 차트
  │
  ├─ [프롬프트 관리] — /admin/prompts
  │   ├ 업종별 프롬프트 목록 (의류/식품/가구/기타)
  │   ├ 프롬프트 텍스트 편집기 (수정 → 저장 → 버전 자동 기록)
  │   ├ 버전 히스토리 (이전 버전 비교, 롤백)
  │   └ 테스트 실행 (샘플 상품 1개로 프롬프트 변경 효과 즉시 확인)
  │
  ├─ [AI 비용 모니터링] — /admin/costs
  │   ├ 일별/월별 API 호출 수 + 비용 차트
  │   ├ 모델별 비용 분류 (Claude 분석 / ChatGPT 인용추적 등)
  │   ├ 고객별 비용 분류 (어느 고객이 가장 많이 사용하는지)
  │   └ 월 비용 상한 알림 설정
  │
  ├─ [AI 인용 추적 관리] — /admin/citations
  │   ├ 전체 추적 현황 (고객별 Citation Score 랭킹)
  │   ├ 추적 실행 로그 (성공/실패/파싱 정확도)
  │   └ 수동 추적 실행 버튼 (특정 고객/상품)
  │
  └─ [데이터 내보내기] — 각 화면에서
      └ CSV 다운로드 (고객 목록, 최적화 이력, 비용 데이터, 인용 추적 결과)
```

### 7-5. 비개발자가 Supabase 직접 조회해야 했던 작업 → 어드민에서 해결

| # | 운영 작업 | 기존 (Supabase 직접) | 어드민 대시보드 |
|---|----------|---------------------|----------------|
| 1 | 고객 현황 파악 | SQL: SELECT * FROM shops | 고객 목록 페이지 + KPI 카드 |
| 2 | 특정 고객 최적화 이력 | SQL: SELECT * FROM optimization_history WHERE shop_id = ? | 고객 상세 → 이력 탭 |
| 3 | 최적화 실패 원인 확인 | n8n 실행 로그 직접 확인 | 실패 건 클릭 → 에러 메시지 표시 |
| 4 | 프롬프트 수정 | n8n 워크플로우 직접 편집 | 프롬프트 편집기에서 수정 + 테스트 |
| 5 | 프롬프트 롤백 | Git 커밋 히스토리 확인 | 버전 히스토리에서 1클릭 롤백 |
| 6 | AI API 비용 확인 | Anthropic/OpenAI 대시보드 각각 접속 | 통합 비용 차트 |
| 7 | 파일럿 고객 관리 | 스프레드시트 별도 운영 | 고객 메모 + 상태 태그 |
| 8 | 서비스 장애 인지 | n8n + Vercel + Supabase 각각 확인 | 어드민 홈에서 시스템 상태 일괄 확인 |
| 9 | 인용 추적 결과 확인 | SQL: SELECT * FROM citation_tracking | 인용 추적 관리 페이지 |
| 10 | 데이터 내보내기 | SQL 결과 → CSV 변환 수동 | 각 화면 CSV 다운로드 버튼 |

---

## 8. Phase별 구현 계획 (Phased Implementation)

### ⚠️ Pre-Phase: 기술 검증 Go/No-Go 게이트 (CEO Review 결정)

```
Week 1 Day 1-3: Cafe24 API로 JSON-LD 주입 가능 여부 기술 검증

  성공 → Phase 0 진행
  실패 → 앱스토어 스크립트 태그 방식으로 전환 시도
  둘 다 실패 → 플랜 재검토

Week 1 Day 1-5: 실제 한국 이커머스 상품 이미지 50장으로 Vision AI 추출 테스트
  - 필드별 정확도 측정 (가격: 99%+, 설명: 80%+)
  - 80% 미만 시 대안 추출 방식 검토
```

> **플랫폼 통합 순서 (CEO Review 결정):** Cafe24 먼저 완성 + 파일럿 고객 확보 → 어댑터 패턴 확립 → 아임웹/고도몰 순차 확장. 3개 동시 개발 금지.

### Phase 0: 프로젝트 기반 구축 [의존성: Pre-Phase 통과] — 2일

```
Task 0-1: Next.js 16.2 프로젝트 생성 (App Router + Turbopack + TypeScript)
Task 0-2: 디자인 시스템 v3.0 토큰 적용 (CSS Variables, 폰트, 색상) + 다크모드 토큰 정의
Task 0-3: Supabase 연결 + 기존 DB 스키마 마이그레이션
Task 0-4: Drizzle ORM 설정 + 기존 database.ts 타입 연동
Task 0-5: 프로젝트 구조 설정 (.claude/, PROGRESS.md, CLAUDE.md, learnings.md)
Task 0-6: vitest + Playwright 기본 설정
Task 0-7: 모듈형 폴더 구조 생성 (app/(public), (dashboard), (admin) + features/ + components/shared/)
Task 0-8: RBAC 기반 설계 — user_profiles 테이블 생성 (role: admin/member) + RLS 정책
Task 0-9: API Route 표준 구조 세팅 (/api/v1/ 접두사 + 표준 응답 포맷 + 에러 포맷)
Task 0-10: 공통 컴포넌트 스켈레톤 (DataTable, KPICard, StatusBadge, EmptyState, CSVExport)

완료 기준:
  ✅ pnpm dev로 로컬 서버 실행
  ✅ Supabase 연결되어 shops/products 테이블 조회 가능
  ✅ tsc → eslint → build 통과
  ✅ 디자인 토큰이 CSS 변수로 주입됨 (라이트 + 다크 모드 토큰 모두)
  ✅ (public), (dashboard), (admin) 라우트 그룹이 독립적으로 동작
  ✅ user_profiles 테이블에 role 컬럼 존재 + RLS 정책 적용
  ✅ DataTable 공통 컴포넌트가 정렬/검색/페이지네이션/CSV 다운로드 지원
```

### Phase 1: 인증 + 상품 관리 [의존성: Phase 0] — 4~5일

```
Task 1-1: Supabase Auth 설정 (이메일+비밀번호 + 구글 OAuth Provider)
Task 1-2: 로그인/회원가입 페이지 (이메일 폼 + "구글로 계속하기" 버튼, 디자인 시스템 적용)
Task 1-3: 구글 소셜 로그인 연동 (Supabase Auth Google Provider + 기존 이메일 계정 충돌 처리)
Task 1-4: 미들웨어 인증 가드 (보호된 라우트 → 로그인 리다이렉트)
Task 1-5: 온보딩 4단계 위저드 (Welcome → ShopInfo → FirstProduct → Complete)
Task 1-6: 상품 목록 페이지 (CRUD + 검색 + 필터 + 페이지네이션)
Task 1-7: 상품 등록 (URL 입력 + 이미지 업로드)
Task 1-8: CSV 벌크 업로드 + 검증 + 에러 표시
Task 1-9: 레이아웃 (Sidebar + Header + 반응형)
Task 1-10: 다크모드 구현 (prefers-color-scheme 시스템 연동 + 헤더 토글 버튼 + localStorage 저장)

완료 기준:
  ✅ 이메일 또는 구글 로그인 → 온보딩 → 상품 등록까지 E2E 동작
  ✅ 구글 로그인 후 동일 이메일 기존 계정 존재 시 자동 연결 (계정 충돌 방지)
  ✅ 상품 CRUD (생성, 조회, 수정, 삭제)
  ✅ CSV 10건 업로드 성공
  ✅ 모바일 반응형 대응 (768px, 480px)
  ✅ 다크모드 토글 시 전체 UI 정상 렌더링 (라이트↔다크)

이 Phase에서 하지 않을 것:
  - 카카오 소셜 로그인 구현하지 않음 (구글만)
  - 상품 카테고리 자동 분류 구현하지 않음
  - 이미지 리사이징/최적화 구현하지 않음
```

### Phase 2: AI 최적화 + 결과 [의존성: Phase 1] — 3~4일

```
Task 2-1: n8n 프롬프트 Claude Sonnet 4.6 전환 (P1~P6, B1)
Task 2-2: n8n 의류 특화 프롬프트 작성 (GEO Content Capsule 규칙 추가)
Task 2-3: 최적화 실행 페이지 (상품 선택 → 플랜 선택 → 실행)
Task 2-4: n8n 웹훅 호출 API Route (/api/optimize)
Task 2-5: 로딩 UI (단계별 프로그레스 메시지, 예상 시간 표시)
Task 2-6: 결과 보기 페이지 (속성 목록 + JSON-LD 미리보기 + 점수)
Task 2-7: 결과 수동 편집 (속성 수정 → JSON-LD 재생성)
Task 2-8: 최적화 이력 (optimization_history 테이블 연동)
Task 2-9: llms.txt 자동 생성 (쇼핑몰 정보 + 최적화 상품 목록 → 텍스트 파일)

완료 기준:
  ✅ 상품 1개 → 최적화 실행 → 결과 확인까지 E2E 동작
  ✅ Basic: 30초 이내, Premium: 90초 이내 응답
  ✅ JSON-LD가 Google Rich Results Test에서 유효
  ✅ llms.txt 파일 생성 + 다운로드 가능
  ✅ n8n 에러 시 사용자 친화적 에러 메시지 표시

이 Phase에서 하지 않을 것:
  - 멀티모달 이미지 분석 구현하지 않음 (텍스트 기반만)
  - Schema.org 자동 검증 구현하지 않음
  - 품질 검수 후 자동 재작업 루프 구현하지 않음
```

### Phase 3: 배포 + 랜딩 [의존성: Phase 2] — 2~3일

```
Task 3-1: 배포 관리 페이지 (코드 복사 / Loader JS 안내)
Task 3-2: Loader JS 생성 (상품별 JSON-LD를 head에 동적 주입)
Task 3-3: 랜딩 페이지 (디자인 시스템 v3.0, Hero + Features + Pricing + CTA)
Task 3-4: 설정 페이지 (프로필, 쇼핑몰 정보 수정, 배포 방식 선택)
Task 3-5: Vercel 배포 + 도메인 연결

완료 기준:
  ✅ Loader JS가 쇼핑몰 페이지에서 JSON-LD를 정상 주입
  ✅ 랜딩 페이지에서 가입까지 전환 가능
  ✅ 비개발자가 URL 입력→최적화→코드 복사까지 혼자 완수 가능
  ✅ 디자인 시스템 체크리스트 18개 이상 충족

이 Phase에서 하지 않을 것:
  - Cafe24 ScriptTag API 자동 설치 구현하지 않음 (CTO 합류 후)
  - SEO 메타데이터 자동 생성 구현하지 않음
```

### Phase 4: 관리자(어드민) 대시보드 [의존성: Phase 1+2] — 3~4일

> Jayden(비개발자)이 Supabase SQL 없이 서비스를 운영할 수 있게 하는 핵심 Phase.
> Phase 2(최적화)가 동작해야 모니터링할 데이터가 존재하므로 Phase 2 이후 구현.

```
Task 4-1: RBAC 미들웨어 (admin/member 역할 분기, user_profiles 테이블 role 컬럼)
Task 4-2: 어드민 레이아웃 (/admin 라우트 그룹, 어드민 전용 Sidebar + 일반 사용자 접근 차단)
Task 4-3: 어드민 홈 — KPI 카드 4개 (총 고객, 총 최적화, 이번 달 API 비용, 시스템 상태)
Task 4-4: 고객 관리 페이지 (목록 + 검색 + 필터 + 상세 + 메모 기능)
Task 4-5: 최적화 모니터링 (전체 실행 로그, 실패 필터, 재실행 버튼, 일별 통계 차트)
Task 4-6: 프롬프트 관리 (업종별 목록, 텍스트 편집기, 저장 시 자동 버전 기록, 이전 버전 비교/롤백)
Task 4-7: 프롬프트 테스트 실행 (샘플 상품 1개 → n8n 호출 → 결과 즉시 표시)
Task 4-8: AI 비용 모니터링 (일별/월별 차트, 모델별/고객별 분류, 월 상한 알림)
Task 4-9: 데이터 내보내기 (각 목록 페이지에 CSV 다운로드 버튼)

완료 기준:
  ✅ Jayden이 Supabase 콘솔 접속 없이 모든 운영 작업 수행 가능
  ✅ admin 역할이 아닌 사용자가 /admin 접근 시 403 페이지 표시
  ✅ 프롬프트 수정 → 저장 → 버전 기록 → 롤백 동작
  ✅ 프롬프트 테스트 실행 → 결과 확인까지 E2E 동작
  ✅ CSV 다운로드 (고객 목록, 최적화 이력, 비용 데이터) 정상 동작

이 Phase에서 하지 않을 것:
  - 드래그 앤 드롭 위젯 재배치 구현하지 않음 (고정 레이아웃)
  - 실시간 대시보드 업데이트 구현하지 않음 (새로고침 또는 30초 폴링)
  - n8n 워크플로우 직접 편집 UI 구현하지 않음 (프롬프트 텍스트만 관리)
  - 고객 계정 생성/삭제 구현하지 않음 (고객이 직접 가입/탈퇴)
```

### Phase 5: AI 인용 추적 PoC [의존성: Phase 2] — 2~3일

```
Task 5-1: n8n Citation Tracker 워크플로우 설계
Task 5-2: 상품별 질문 세트 자동 생성 (Claude API)
Task 5-3: ChatGPT API 질의 + 응답 파싱 (상품명/URL 매칭)
Task 5-4: Citation Score 계산 로직 (0~100)
Task 5-5: citation_tracking 테이블 저장
Task 5-6: PoC 결과 검증 (의류 10건, 파싱 정확도 80%+ 목표)

완료 기준:
  ✅ 의류 상품 10개에 대해 ChatGPT 응답에서 인용 여부 파싱 성공
  ✅ 파싱 정확도 80% 이상 (수동 대조)
  ✅ Citation Score가 DB에 저장됨
  ✅ PoC 성공 시 → Phase 5에서 본격 구현 결정

이 Phase에서 하지 않을 것:
  - Perplexity/Gemini API 연동하지 않음 (ChatGPT만으로 PoC)
  - Before/After 리포트 UI 구현하지 않음 (DB 저장만)
  - 스케줄 자동 실행 구현하지 않음 (수동 트리거)
```

### Phase 6: Cafe24 연동 + 인용 추적 본격화 [의존성: Phase 3+5, CTO 합류] — 4~5일

```
Task 6-1: Cafe24 OAuth 2.0 연동 (앱 등록 + 인증 플로우)
Task 6-2: 상품 수집 API (GET /api/v2/admin/products → Supabase 저장)
Task 6-3: 상품 선택 UI (체크박스 + 전체선택 + 카테고리 필터)
Task 6-4: ScriptTag API로 Loader JS 원클릭 설치
Task 6-5: AI 인용 추적 대시보드 (Citation Score 시계열 차트)
Task 6-6: Before/After 리포트 페이지
Task 6-7: n8n Schedule 트리거 (주 1회 자동 추적)
Task 6-8: Perplexity + Gemini API 추가

완료 기준:
  ✅ Cafe24 쇼핑몰 연결 → 상품 자동 수집 → 선택 → 최적화 → 자동 적용 E2E
  ✅ AI 인용 추적 주 1회 자동 실행
  ✅ Before/After 리포트에서 Citation Score 변화 확인 가능

이 Phase에서 하지 않을 것:
  - 아임웹/고도몰 연동 구현하지 않음
  - 결제 시스템 구현하지 않음
```

### Phase 7: 결제 + 유료 전환 [의존성: Phase 6] — 3일

```
Task 7-1: 토스페이먼츠 구독 결제 연동
Task 7-2: 플랜 관리 (Starter/Growth/Pro)
Task 7-3: 사용량 제한 (플랜별 상품 수 제한)
Task 7-4: 결제 실패/갱신 실패 처리
Task 7-5: 플랜 업그레이드/다운그레이드

완료 기준:
  ✅ Starter 플랜 결제 → 서비스 이용 → 월 자동 갱신 E2E
  ✅ 결제 실패 시 7일 유예 + 기능 제한 안내
```

---

## 9. 기술 스택

### 프론트엔드

| 항목 | 선택 | 근거 |
|------|------|------|
| 프레임워크 | Next.js 16.2 (App Router + Turbopack) | Vibe Coding 표준, RSC 우선 |
| 패키지매니저 | pnpm | 속도 + 디스크 효율 |
| UI | shadcn/ui + Tailwind CSS | 디자인 시스템 v3.0 커스텀 적용 |
| 상태관리 | TanStack Query v5 | 서버 상태 관리 |
| ORM | Drizzle ORM | 타입 안전, Supabase 직접 쿼리 대체 |
| 폰트 | Pretendard Variable (본문), DM Sans (제목) | 디자인 시스템 규칙 |
| 테스트 | vitest + Playwright | 단위 + E2E |

### 백엔드 / AI

| 항목 | 선택 | 근거 |
|------|------|------|
| DB | Supabase (PostgreSQL + RLS) | 기존 자산 유지 |
| 인증 | Supabase Auth (이메일+비밀번호 + 구글 OAuth) | 최소 구현 + 가입 허들 제거 |
| AI 분석 | n8n v8 워크플로우 → Claude Sonnet 4.6 | ✅ 이번 전환 결정 |
| AI 인용추적 | n8n Schedule → ChatGPT/Perplexity/Gemini API | 능동 추적 방식 B |
| 배포 | Vercel | Preview URL → 확인 → main 머지 |
| n8n 호스팅 | Elest.io 셀프호스팅 | 비용 효율 |

### AI 컴포넌트 아키텍처

```
[n8n v8 워크플로우 — AI 분석]

  Webhook 수신
       │
  데이터 정규화
       │
  플랜 분기 ──────────────────────────┐
       │                              │
  [Premium: 5-Agent]            [Basic: 1-Agent]
       │                              │
  ┌── 업종 분기 (신규) ──┐      B1. AI 최적화
  │    │    │    │        │      (올인원 1회)
  의류  식품  가구  기타   │           │
  │    │    │    │        │      B2. 결과 정리
  각 업종별 전용           │           │
  프롬프트 적용            │      B3. DB 저장
       │                  │           │
  P1. 상품 분석가 ←───────┘      B4. 응답
  P2. 콘텐츠 작가
  P3. FAQ 전문가
  P4. 비교 분석가
  P5. 결과 통합
  P6. 품질 검수
  P7. 최종 정리
  P8. DB 저장
  P9. 응답

[n8n v8 — 모델 전환 변경사항]
  - 모든 HTTP Request 노드: api.openai.com → api.anthropic.com
  - 헤더: Authorization: Bearer → x-api-key + anthropic-version
  - 요청 body: messages 포맷 OpenAI → Anthropic 변환
  - system prompt: role: "system" → system 최상위 필드
  - 응답 파싱: choices[0].message.content → content[0].text
```

### 외부 API 의존성 + 폴백

| 서비스 | 용도 | 장애 시 대응 |
|--------|------|-------------|
| Claude API | 상품 분석, llms.txt 생성 | 에러 메시지 + 수동 재시도. 장기 장애 시 GPT-4o 폴백 가능 |
| Cafe24 Admin API | 상품 수집, 자동 적용 | "쇼핑몰 연결 일시 중단" 안내 + 수동 입력 유도 |
| ChatGPT API | AI 인용 추적 | 해당 플랫폼 스킵 + 나머지 플랫폼으로 추적 계속 |
| Perplexity API | AI 인용 추적 | 동일 |
| Supabase | DB + Auth | 핵심 의존성, SLA 99.9%. 장애 시 서비스 전체 중단 |
| Vercel | 프론트 배포 | 장애 시 서비스 접근 불가. Vercel SLA 99.99% |

---

## 10. 수익 모델

### 가격 구조

| 플랜 | 월 요금 | 상품 수 | 초과 건당 | AI 인용 추적 |
|------|--------|---------|----------|------------|
| Starter | 9.9만원 | 50개 | 500원 | 월 1회 |
| Growth | 19.9만원 | 200개 | 300원 | 주 1회 |
| Pro | 39.9만원 | 500개 | 300원 | 주 1회 + 커스텀 질문 |

### 원가 구조 (상품 1건 기준)

| 항목 | Basic | Premium |
|------|-------|---------|
| Claude API | ~100원 | ~250원 |
| n8n 실행 비용 | ~10원 | ~30원 |
| DB 저장 | ~1원 | ~1원 |
| **합계** | **~111원** | **~281원** |
| **판매가** | 500원 (초과건) | 포함 |
| **이익률** | 78% | ~70% |

### AI 인용 추적 원가 (상품 100개 기준)

```
질문 세트: 상품당 10개 × 100개 = 1,000 질문
AI 3개 플랫폼 = 3,000회 API 호출/월
비용: ~$30/월 (~3.3만원)
→ Growth 1개사 요금(19.9만원)으로 충분히 커버
```

### 손익분기

```
월 운영비: ~15만원 ($140)
Starter 2개사 = 19.8만원 → 운영비 커버
50개사 목표: 월 매출 495만원, 운영비 15만원 → 이익률 97%
```

### 모델 비용 하락 대응

Outcome 기반 가격 전략 권장:
- "AI 인용 10% 증가"에 가치를 부여 → 모델 비용 하락해도 고객 가치는 유지
- 모델 비용 절감분은 마진 확대 또는 가격 인하로 시장 확대에 사용

---

## 11. 경쟁사 분석

| 비교 항목 | 카페24 (llms.txt) | Profound | Zoovu | **chatsio** |
|----------|------------------|----------|-------|------------|
| 구조화 범위 | 쇼핑몰 전체 | SKU 단위 | 상품 데이터 보강 | **SKU 단위** |
| 이미지→속성 | ❌ | 부분 지원 | ❌ | **✅ 멀티모달 AI (Phase 5)** |
| AI 인용 추적 | ❌ | 브랜드 수준 | ❌ | **✅ SKU 단위** |
| llms.txt 자동 | ✅ (자사만) | ❌ | ❌ | **✅** |
| 대상 시장 | 자사 입점몰 | 영어권·대기업 | 영어권·대기업 | **한국 중소몰** |
| 월 비용 | 무료(자사 기능) | $500+/월 | $1,000+/월 | **9.9만원~** |
| 한국어 특화 | ✅ | ❌ | ❌ | **✅** |

### Competitive Moat (방어 가능한 차별화)

1. **업종별 AI 지시문 축적**: 의류부터 시작, 카테고리당 100시간+ 튜닝 → 후발주자 진입 비용 높음
2. **AI 인용 데이터 플라이휠**: 추적 데이터가 쌓일수록 → 최적화 품질 향상 → 더 많은 고객 → 더 많은 데이터
3. **역설계 선순환**: ①번이 ②번의 연료, ②번의 결과가 ①번 개선에 피드백
4. **한국어 + 중소몰 특화**: 글로벌 플레이어가 한국 중소몰 시장에 집중할 인센티브 없음

---

## 12. 비기능 요구사항

### 성능

| 항목 | 목표 |
|------|------|
| 페이지 로딩 (LCP) | < 2.5초 |
| API 응답 (DB 조회) | < 500ms |
| AI 최적화 Basic | < 30초 |
| AI 최적화 Premium | < 90초 |
| 동시 사용자 | 50명 (초기 목표 50개사 기준) |
| Loader JS 크기 | < 10KB (gzip) |

### 보안 (🔴 보안 중요 — CEO Review 결정)

> 결제(Toss Payments) + 고객 쇼핑몰 OAuth 토큰 = "돈 + 신분" → 🔴 등급

| 항목 | 구현 |
|------|------|
| 인증 | Supabase Auth (bcrypt 해싱, JWT 세션, 구글 OAuth PKCE) |
| DB 접근 | Supabase RLS (user_id 기반 행 수준 보안) — **필수, 예외 없음** |
| API 키 | 환경변수 (.env.local) + Vercel 시크릿 |
| Cafe24 OAuth 토큰 | Supabase에 **AES-256 암호화** 저장 + **토큰 갱신 로직** |
| 결제 | Toss Payments 서버사이드만. 클라이언트에 PG 키 노출 금지 |
| CORS | 허용 도메인 명시 |
| 입력 검증 | Zod 스키마 + SQL 인젝션 방지 (Drizzle ORM) |
| HTTPS | Vercel 자동 SSL |
| 중복 방지 | 쇼핑몰당 1계정 unique constraint |
| 멱등성 | order_id 기반 idempotency key로 중복 처리 방지 |

> 🔴 **보안 규칙:**
> - 인증/결제 관련 코드는 n8n 자동화 금지. 직접 코드 + Jayden 수동 검증
> - OAuth 토큰 관리에 n8n 사용 금지
> - 고객 A가 고객 B의 쇼핑몰 데이터에 접근 불가하도록 RLS 필수 검증

### 확장성

| 시나리오 | 대응 |
|---------|------|
| 50개사 → 500개사 | Supabase Pro 업그레이드 ($25/월 → $89/월) |
| AI 호출량 증가 | n8n 워커 스케일 + Claude API 동시 요청 관리 |
| 인용 추적 빈도 증가 | n8n Schedule 분산 + 결과 캐싱 |
| 어드민 기능 추가 | 모듈형 구조로 신규 페이지 독립 추가 가능 |

### 🆕 유지보수 용이성 — 비개발자 운영 + CTO/기획자 인수인계 대비

> **설계 원칙:** CTO('26.06)와 기획자('26.08) 합류 시 코드베이스를 빠르게 파악하고
> 기능을 독립적으로 추가/수정할 수 있어야 한다.

**① 모듈형 폴더 구조 (Feature-based Architecture)**

```
src/
├── app/
│   ├── (public)/          ← 비로그인 접근 (랜딩, 로그인, 회원가입)
│   │   ├── page.tsx       ← 랜딩 페이지
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/       ← 일반 사용자 (member 역할)
│   │   ├── layout.tsx     ← 사용자 Sidebar + Header
│   │   ├── products/      ← 상품 관리
│   │   ├── optimize/      ← 최적화 실행/결과
│   │   ├── deploy/        ← 배포 관리
│   │   ├── citations/     ← AI 인용 리포트
│   │   └── settings/      ← 설정
│   └── (admin)/           ← 관리자 (admin 역할)
│       ├── layout.tsx     ← 어드민 Sidebar + Header (별도)
│       ├── page.tsx       ← 어드민 홈 (KPI)
│       ├── customers/     ← 고객 관리
│       ├── optimizations/ ← 최적화 모니터링
│       ├── prompts/       ← 프롬프트 관리
│       ├── costs/         ← AI 비용 모니터링
│       └── citations/     ← 인용 추적 관리
├── features/              ← 도메인별 비즈니스 로직 (모듈 독립)
│   ├── auth/              ← 인증 (hooks, utils, types)
│   ├── products/          ← 상품 (hooks, utils, types, api)
│   ├── optimize/          ← 최적화 (hooks, utils, types, api)
│   ├── citations/         ← 인용 추적
│   ├── prompts/           ← 프롬프트 관리
│   └── admin/             ← 어드민 전용 로직
├── components/
│   ├── ui/                ← shadcn/ui 공통 컴포넌트
│   ├── shared/            ← 프로젝트 공통 (DataTable, KPICard, StatusBadge 등)
│   └── layouts/           ← 레이아웃 컴포넌트
├── lib/
│   ├── db/                ← Drizzle 스키마 + 쿼리
│   ├── auth/              ← Supabase Auth 헬퍼
│   └── api/               ← API 클라이언트 (n8n, Claude, 외부)
└── types/                 ← 전역 타입 정의
```

**핵심 규칙:**
- `features/` 폴더 간 직접 import 금지 → `lib/` 또는 API를 통해 통신
- 새 기능 추가 = `features/새기능/` 폴더 + `app/` 라우트만 추가
- 기존 기능 수정 시 다른 `features/` 에 영향 없음

**② 공통 컴포넌트 설계 (재사용성)**

| 컴포넌트 | 용도 | 사용 위치 |
|---------|------|----------|
| `DataTable` | 정렬+검색+필터+페이지네이션+CSV 다운로드 | 상품 목록, 고객 목록, 최적화 로그, 모든 목록 화면 |
| `KPICard` | 숫자 + 라벨 + 변화율 뱃지 | 어드민 홈, 사용자 대시보드 |
| `StatusBadge` | 상태 표시 (성공/실패/대기/처리중) | 최적화 상태, 시스템 상태, 결제 상태 |
| `ChartWrapper` | Recharts 래퍼 (라인/바/파이) | 비용 차트, 인용 추이, 최적화 통계 |
| `EmptyState` | 데이터 없을 때 가이드 + CTA | 모든 목록 화면 |
| `ConfirmDialog` | 위험 작업 전 확인 | 삭제, 롤백, 재실행 |
| `CodeEditor` | 프롬프트 편집 (구문 강조 + 줄번호) | 프롬프트 관리 |
| `CSVExport` | CSV 다운로드 버튼 | 모든 DataTable에 부착 |

**③ API Route 설계 규칙 (일관성)**

```
/api/v1/products          ← 상품 CRUD
/api/v1/optimize          ← 최적화 실행
/api/v1/citations         ← 인용 추적
/api/v1/admin/customers   ← 어드민: 고객 관리
/api/v1/admin/stats       ← 어드민: KPI 데이터
/api/v1/admin/prompts     ← 어드민: 프롬프트 CRUD
/api/v1/admin/costs       ← 어드민: 비용 데이터
/api/v1/admin/export      ← 어드민: CSV 내보내기

규칙:
  - /api/v1/ 접두사로 향후 API 버전 관리 가능
  - /api/v1/admin/* 는 RBAC 미들웨어에서 admin 역할만 허용
  - 모든 응답은 { data, error, pagination } 표준 포맷
  - 에러 응답은 { error: { code, message, details } } 표준 포맷
```

**④ DB 스키마 확장 패턴**

```
새 기능 추가 시:
  1. lib/db/schema/ 에 새 테이블 스키마 파일 추가
  2. Drizzle migrate 실행 (SQL 자동 생성)
  3. features/새기능/ 에 쿼리 함수 작성
  → 기존 테이블/기능에 영향 없음

예시: 향후 "웹 카탈로그" 기능 추가 시
  1. lib/db/schema/catalogs.ts 추가
  2. features/catalogs/ 폴더 생성
  3. app/(dashboard)/catalogs/ 라우트 추가
  → products, optimize 등 기존 기능 코드 수정 없음
```

**⑤ 환경별 설정 관리**

```
.env.local         ← 로컬 개발 (Git 미추적)
.env.production    ← Vercel 프로덕션 (Vercel 대시보드에서 관리)
.env.example       ← 환경변수 목록 + 설명 (Git 추적, 값은 비움)

필수 환경변수:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY     ← 서버 전용, 어드민 API에서 사용
  N8N_WEBHOOK_URL
  N8N_WEBHOOK_SECRET
  ANTHROPIC_API_KEY
  OPENAI_API_KEY                ← 인용 추적용
```

---

## 13. Go-to-Market 접근법

### 런칭 전략

```
Phase A: 알파 (내부 테스트) — '26.04~05
  Jayden이 의류 10건으로 전체 파이프라인 검증

Phase B: 베타 (파일럿) — '26.07~09
  PG 네트워크로 의류 쇼핑몰 5개사 확보
  무료 체험 제공 (3개월) → Before/After 데이터 수집
  피드백 기반 프롬프트/UX 개선

Phase C: 소프트 런칭 — '26.10~11
  Cafe24 앱스토어 등록 (월 신규 8~10개사 목표)
  성공사례 콘텐츠 제작 (블로그, 유튜브)

Phase D: 유료 전환 — '26.11~'27.01
  파일럿 5개사 유료 전환 (Before/After 리포트가 핵심 근거)
  앱스토어 통한 신규 가입 시작
```

### 초기 사용자 확보 채널

| 채널 | 방법 | CAC |
|------|------|-----|
| PG 네트워크 (직접 영업) | 대표 16년 PG 영업 인맥 활용 | 0원 |
| Cafe24 앱스토어 | 카테고리 "SEO/마케팅" 등록 | 매출의 20% (카페24 수수료) |
| 성공사례 콘텐츠 | "AI 인용 35% 증가한 방법" 블로그/유튜브 | 콘텐츠 제작비만 |
| 이커머스 커뮤니티 | 카페24 포럼, 쇼핑몰 운영자 카페 | 0원 |

---

## 14. 리스크 & 제약사항

| 리스크 | 영향 | 확률 | 완화 전략 |
|--------|------|------|----------|
| **AI 인용 추적 파싱 정확도 부족** | 🔴 높음 | 🟡 중간 | 5월 PoC에서 검증. 80% 미만 시 전문 도구(Siftly) API로 전환 |
| **파일럿 고객 확보 지연** | 🔴 높음 | 🟡 중간 | PG 네트워크 직접 연락 + 3개월 무료 체험 + "연결→선택→승인" 3단계 UX |
| **Claude 전환 시 출력 품질 변동** | 🟡 중간 | 🟢 낮음 | 의류 10건 A/B 테스트 후 전환 확정 |
| **Cafe24 앱스토어 심사 지연** | 🟡 중간 | 🟡 중간 | CTO 합류 직후 가이드라인 사전 확인. 심사 전 수동 토큰 방식으로 파일럿 |
| **대시보드 신규 개발 일정 초과** | 🟡 중간 | 🟡 중간 | PRD + Task 분해 선행, Phase별 독립 배포, 2주 버퍼 |
| **AI 모델 API 가격 인상** | 🟡 중간 | 🟢 낮음 | Outcome 기반 가격 → 모델 비용과 고객 가치 분리 |
| **경쟁사(카페24) 기능 확장** | 🟡 중간 | 🟡 중간 | SKU 단위 구조화 + AI 인용 추적 = 카페24가 제공하기 어려운 깊이 |
| **멀티모달 이미지 분석 정확도** | 🟡 중간 | 🟡 중간 | Phase 5에서 Claude Vision 테스트. 부족하면 GPT-4o Vision 병행 |

### AI 리스크 (추가)

| 항목 | 대응 |
|------|------|
| 모델 의존성 | Claude 주력 + GPT-4o 폴백 유지. 1~2년 후 sLLM 파인튜닝 로드맵 |
| 데이터 편향 | 의류 50건 검증 완료. 업종 확장 시 각 100건+ 추가 검증 |
| 환각 (사실과 다른 속성) | 프롬프트에 환각 방지 4대 규칙 + P6 품질 검수 Agent |
| AI 인용 추적 결과 불안정 | 동일 질문 반복 시 40~60% 결과 변동 (업계 공통). 주 1회 평균으로 안정화 |
| 비용 예측 불확실성 | 상품당 원가 추정치에 30% 버퍼 적용. 월 API 비용 상한 알림 설정 |

---

## 15. 완료 기준 (Definition of Done)

### 전체 프로젝트 (MVP)

```
✅ 비개발자(이사장 페르소나)가 혼자서:
   가입 → 쇼핑몰 연결 → 상품 선택 → 최적화 → 코드 적용
   까지 30분 이내에 완료할 수 있다

✅ 비개발자(Jayden)가 어드민 대시보드에서:
   고객 현황 확인, 최적화 실패 건 재실행, 프롬프트 수정/테스트,
   AI 비용 확인, 데이터 CSV 내보내기를 Supabase 접속 없이 수행할 수 있다

✅ 의류 50건 기준 속성 추출 정확도 95%+

✅ 생성된 JSON-LD가 Google Rich Results Test 100% 통과

✅ llms.txt 파일이 자동 생성되어 다운로드 가능

✅ AI 인용 추적 PoC에서 ChatGPT 응답 파싱 정확도 80%+

✅ 대시보드가 디자인 시스템 v3.0 체크리스트 18개 이상 충족

✅ CTO/기획자 합류 시 features/ 폴더만 보면 전체 기능 구조 파악 가능

✅ tsc → eslint → build → test 모두 통과
```

### Phase별 완료 기준

| Phase | 핵심 확인 |
|-------|----------|
| Phase 0 | pnpm dev 실행 + Supabase 연결 + 디자인 토큰 적용 |
| Phase 1 | 가입(이메일+구글)→온보딩→상품 등록 E2E + 다크모드 + 반응형 |
| Phase 2 | 상품 선택→최적화→결과 확인 E2E + llms.txt 생성 |
| Phase 3 | Loader JS 동작 + 랜딩 페이지 + Vercel 배포 |
| Phase 4 | 어드민 대시보드 — Jayden이 Supabase 없이 전체 운영 가능 |
| Phase 5 | AI 인용 추적 PoC 파싱 정확도 80%+ |
| Phase 6 | Cafe24 연결→수집→최적화→자동적용 E2E + 인용 리포트 |
| Phase 7 | 결제→서비스 이용→월 갱신 E2E |

### "이 제품이 성공했다"의 정의

```
파일럿 5개사 중 3개사 이상이:
  1. "AI 인용이 증가했다"는 데이터를 Before/After 리포트에서 확인하고
  2. 유료 플랜으로 전환하고
  3. 3개월 이상 유지(이탈하지 않음)
→ 이 세 가지가 동시에 충족되면 MVP 성공
```

---

## 부록 A: 개발 일정표

```
시간축
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

'26.04.2주  PRD V2 확정 + Epic/Task 분해           ← 지금
'26.04.3주  Phase 0 (프로젝트 기반 + 모듈 구조 + RBAC) + Phase 1 시작
'26.04.4주  Phase 1 계속 (인증 + 구글 로그인 + 상품관리 + 다크모드)
'26.05.1주  Phase 1 완료 + Phase 2 시작 (n8n Claude 전환 + 최적화)
'26.05.2주  Phase 2 완료 + Phase 3 시작 (배포 + 랜딩)
'26.05.3주  Phase 3 완료 + Phase 4 시작 (어드민 대시보드)
'26.05.4주  Phase 4 완료 (어드민) + Phase 5 병렬 시작 (인용추적 PoC)
'26.06.1주  Phase 5 완료 + 전체 E2E 검증
─────────── CTO 합류 ──────────────────────────────
'26.06      Phase 6 시작 (Cafe24 + 인용추적 본격)
'26.07~08   Phase 6 완료 + 파일럿 5개사 확보
─────────── 기획자 합류 ─────────────────────────────
'26.08      UI/UX 개선 + 어드민 UX 고도화 + 파일럿 피드백 반영
'26.09~10   Phase 7 (결제) + 앱스토어 등록
'26.11~01   유료 전환 + 50개사 추진
```

---

## 부록 B: n8n 프롬프트 전환 체크리스트

### GPT-4o → Claude Sonnet 4.6 전환 시 변경 사항

| 항목 | GPT-4o (현재) | Claude Sonnet 4.6 |
|------|-------------|-------------------|
| API 엔드포인트 | api.openai.com/v1/chat/completions | api.anthropic.com/v1/messages |
| 인증 헤더 | Authorization: Bearer {key} | x-api-key: {key} + anthropic-version: 2023-06-01 |
| system prompt | messages 배열 내 role: "system" | 최상위 system 필드 |
| 응답 파싱 | choices[0].message.content | content[0].text |
| 모델명 | gpt-4o | claude-sonnet-4-6-20250514 |
| max_tokens | 4096 | 4096 (동일, 필수 파라미터) |
| temperature | 0.3 (현재) | 0.3 (유지) |

### 프롬프트 품질 강화 (GEO Content Capsule 규칙 추가)

```
[기존 환각 방지 4대 규칙 유지]
+ [신규 GEO 규칙]
  1. Semantic Completeness: 각 속성 설명은 134~167단어의 자기 완결적 단위로 작성
  2. FAQ 구조: 질문형 소제목 + 즉답(30~60자) + 근거 2~3문장
  3. Schema Nesting: Product → Offer → AggregateRating 연결 구조
  4. Content Capsule: 질문형 H2/H3 → 즉답 → 근거 순서
```

---

## 부록 C: DB 스키마 활용 계획

### 기존 테이블 (유지)

| 테이블 | 용도 | 변경사항 |
|--------|------|---------|
| shops | 쇼핑몰 정보 | cafe24_access_token, cafe24_refresh_token 컬럼 추가 |
| products | 상품 + 최적화 결과 | 기존 30+ 컬럼 유지 |
| optimization_history | 버전별 이력 | 데이터 적재 로직 구현 (Phase 2) |

### 신규/확장 테이블

| 테이블 | 용도 | Phase |
|--------|------|-------|
| user_profiles | 사용자 역할(admin/member) + 프로필 확장 정보 | Phase 1 |
| prompt_versions | 프롬프트 버전 관리 (업종, 텍스트, 버전번호, 생성일, 활성 여부) | Phase 4 |
| admin_notes | 고객별 어드민 메모 (shop_id, 메모 텍스트, 작성일) | Phase 4 |
| api_usage_logs | AI API 호출 로그 (모델, 토큰수, 비용, 호출시간, 고객ID) | Phase 4 |
| system_health | 시스템 상태 스냅샷 (n8n/API 응답시간, 에러율, 체크시간) | Phase 4 |
| citation_tracking | AI 인용 추적 결과 (질문, AI 응답, 인용 여부, 점수) | Phase 5 |
| citation_questions | 상품별 자동 생성 질문 세트 | Phase 5 |
| llms_txt_versions | llms.txt 생성 이력 | Phase 2 |
| cafe24_connections | Cafe24 OAuth 연결 정보 (암호화 토큰) | Phase 6 |
| extraction_logs | 상품별 추출 결과 + 필드별 신뢰도 점수 + 원본 이미지 URL (CEO Review) | Phase 2 |
| cost_tracking | 고객별 Vision AI API 비용 추적 (CEO Review) | Phase 2 |
| injection_verification | JSON-LD 주입 후 크롤링 검증 결과 로그 (CEO Review) | Phase 3 |

---

## 부록 D: 검증 체크리스트 (Self-Verification)

### 사용자 플로우 7대 체크
- [x] 인증/회원가입 플로우 — Supabase Auth 이메일+비밀번호 + 구글 소셜 로그인
- [x] 온보딩 (첫 사용 경험) — 4단계 위저드
- [x] 핵심 기능 플로우 — 상품 등록 → 최적화 → 결과 → 적용
- [-] 결제 플로우 — Phase 7 (의식적 후순위)
- [x] 에러/실패 상태 처리 — 섹션 7-3에 정의
- [x] 설정/프로필 관리 — Phase 3 Task 3-4
- [-] 알림/이메일 전략 — Not Doing (인앱 상태만)

### 시스템 플로우 7대 체크
- [x] API 구조 — n8n 웹훅 + Next.js API Route (/api/v1/ 표준)
- [x] 인증/세션 관리 — Supabase Auth JWT + RBAC (admin/member)
- [x] 외부 API 의존성과 실패 처리 — 섹션 9 폴백 전략
- [x] 보안 정책 — 🟡 부분 보안, RLS, 토큰 암호화, 어드민 라우트 보호
- [x] 에러 처리/로깅 — n8n try-catch + 사용자 친화 메시지 + 어드민 에러 로그
- [-] 백그라운드 크론 — Phase 5 (인용 추적 주 1회)
- [-] 결제 웹훅 — Phase 7

### AI 플로우 체크
- [x] AI 입출력 스키마 — 기존 database.ts 타입 체계 유지
- [x] 프롬프트/모델 선택 근거 — Claude Sonnet 4.6, 부록 B
- [x] AI 실패 시 사용자 경험 — 에러 메시지 + 재시도
- [x] 모델 평가 전략 — 의류 50건 수동 검증 + 파일럿 피드백
- [x] 비용 추정 — 섹션 10 원가 구조
- [x] 프롬프트 관리 — 어드민 대시보드에서 편집/테스트/버전 관리 가능

### 🆕 어드민 대시보드 체크
- [x] 비개발자가 Supabase 접속 없이 전체 운영 가능한가?
- [x] 고객 현황을 한눈에 파악 가능한가? (KPI 카드 + 목록)
- [x] 최적화 실패 건을 확인하고 재실행할 수 있는가?
- [x] 프롬프트를 수정→테스트→롤백할 수 있는가?
- [x] AI 비용을 모니터링하고 이상 징후를 알 수 있는가?
- [x] 운영 데이터를 CSV로 내보낼 수 있는가?
- [x] admin 역할이 아닌 사용자의 /admin 접근이 차단되는가?

### 🆕 확장성/유지보수 체크
- [x] features/ 폴더 간 직접 의존 없이 독립적인가?
- [x] 새 기능 추가 시 기존 코드 수정 없이 폴더+라우트 추가만으로 가능한가?
- [x] 공통 컴포넌트(DataTable, KPICard 등)가 재사용 가능하게 설계되었는가?
- [x] API Route가 /api/v1/ 표준 구조를 따르는가?
- [x] CTO/기획자 합류 시 폴더 구조만 보면 전체 기능 파악 가능한가?
- [x] DB 스키마 확장 시 기존 테이블 수정 없이 새 테이블 추가만으로 가능한가?
- [x] 환경변수가 .env.example로 문서화되어 있는가?

### Vibe Coding 호환성 체크
- [x] 각 Phase가 명확한 완료 기준 제공 — ✅ 체크리스트 형식
- [x] Not Doing이 긍정문으로 명시 — 섹션 6
- [x] 의존성 순서 명확 — Phase 0→1→2→3→4(어드민) / 5 병렬 / 6→7
- [x] 구체성 — "두 명의 개발자가 같은 결과물"을 만들 수 있는 수준

### 기본 체크
- [x] Empty State 정의 — 섹션 7-2
- [-] 결제 실패 후 사용자 여정 — Phase 7에서 정의
- [x] Mutable 데이터 하드코딩 안 함 — 시장 데이터에 출처/날짜 명시

---

---

## 부록 E: CEO + Eng Review 결정사항 요약 (2026-04-05)

> /office-hours → /plan-ceo-review (HOLD SCOPE) → /plan-eng-review → Codex 독립검토

### 전략적 결정
| # | 결정 | 근거 |
|---|------|------|
| 1 | 보안등급 🟡→🔴 | 결제(Toss) + 고객 쇼핑몰 OAuth = "돈+신분" |
| 2 | Cafe24 우선, 순차 통합 | 리스크 격리. 한국 시장점유율 1위(~35%) |
| 3 | "상품 데이터 인프라" 포지셔닝 | AI 이미지 인식 시대에도 가치 유지 |
| 4 | 시뮬레이터/경쟁비교 시기 연기 | PMF 전 scope addiction 방지 (Codex 지적) |

### 아키텍처 결정
| # | 결정 | 근거 |
|---|------|------|
| 5 | n8n 유지 + 50스토어 마이그레이션 | 익숙한 도구로 빠르게 시작 |
| 6 | Next.js API → n8n webhook 통신 | 가장 단순, 디버깅 용이 |
| 7 | order_id idempotency key | 중복 처리 방지 (비용 낭비 + 데이터 오염) |
| 8 | DB 스키마 사전 설계 (8+3 테이블) | 프로젝트의 백본 |

### 품질/안전 결정
| # | 결정 | 근거 |
|---|------|------|
| 9 | 에러 처리 3원칙 | Silent Failure 완전 방지 |
| 10 | 필드별 품질 계층 | 가격 오류 = 치명적 (Codex 지적) |
| 11 | 데이터 동기화 전략 | 오래된 가격 = 구글/네이버 페널티 (Codex 지적) |
| 12 | Pre-Phase Go/No-Go 게이트 | Make-or-break 기술 검증 최우선 |

### CEO 확장 기능 (수락됨)
| # | 기능 | 시기 |
|---|------|------|
| S7 | 네이버 쇼핑 EP 자동 생성 | Phase 2-3 (코어와 함께) |
| S8 | AI Readiness Score (무료 도구) | Phase 3 (랜딩과 함께) |
| S9 | 주간 AI 리포트 (KakaoTalk/이메일) | Phase 5 이후 |

### Codex 독립검토 주요 반영 (25개 발견 중 핵심 3개)
1. 필드별 품질 게이트 → 위험 필드는 API 우선, OCR은 fallback
2. 데이터 신선도 동기화 → webhook/cron으로 가격 자동 업데이트
3. scope 시기 조정 → 시뮬레이터/경쟁비교를 파일럿 후로 이동

### Review Readiness
```
CEO Review:  CLEAR (2026-04-05)
Eng Review:  CLEAR (2026-04-05)
Outside Voice: Codex 25 findings, 3 tension points resolved
```

---

*본 PRD는 예비창업패키지 사업계획서, 현황분석 보고서, PM 추가논의 자료, n8n v7 워크플로우 분석, 2026.04 최신 GEO/AI 시장 데이터, 그리고 CEO+Eng Review 결정사항(2026-04-05)을 기반으로 작성되었습니다.*
