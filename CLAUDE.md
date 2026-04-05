# Chatsio — 상품 데이터 인프라 SaaS

## Project Information
- **Description**: 한국 중소 쇼핑몰 상품 이미지를 AI로 구조화(JSON-LD + 네이버EP)하고, AI 검색엔진 인용을 추적하는 SaaS
- **Tech Stack**: Next.js 16.2 (App Router + Turbopack) + TypeScript + Tailwind CSS + Shadcn/UI + Supabase + Drizzle ORM + n8n
- **Security Level**: 🔴 보안 중요 (결제 + 고객 쇼핑몰 OAuth 토큰)
- **Port**: 3800

## Quick Start
```bash
pnpm install
pnpm dev
```

## Key Documents
- `docs/PRD.md` — 기획서 (CEO+Eng Review 완료 2026-04-05)
- `docs/PROGRESS.md` — 세션 진행 기록
- `docs/ARCHITECTURE.md` — 시스템 설계
- `docs/learnings.md` — 교훈 기록

## Design References
- `docs/design-references/` — Stitch 디자인 에셋 (20+ 화면)
- PNG = 레이아웃 참조, `stitch-code/` = 정확한 색상/간격 수치
- 구현 시 `~/.claude/skills/design-system.md` 규칙 우선 적용
- 디자인 시스템: "Editorial Architect" — DM Sans + Pretendard, Azure/Mint

## CEO + Eng Review 핵심 결정 (2026-04-05)

### 아키텍처
- Cafe24 우선, 나머지 플랫폼(아임웹/고도몰) 순차 확장
- Next.js API Route → n8n webhook 통신 (가장 단순)
- order_id 기반 idempotency key (중복 처리 방지)
- n8n은 AI 추출 파이프라인에만 사용. 50스토어 도달 시 마이그레이션 검토

### 에러 처리 3원칙
1. 추출 실패 → '수동확인필요' 상태 + 알림 (Silent Failure 금지)
2. JSON-LD 주입 후 크롤링 검증 (실제 적용 확인)
3. 결제 후 실패 → 자동재시도 2회 + 전액환불

### 필드별 품질 계층
- 위험 필드 (가격/성분/재료) → Cafe24 API 우선, OCR은 fallback만
- 일반 필드 (설명/브랜드/소재) → OCR 허용

### 데이터 동기화
- 가격/재고 변경 시 Cafe24 webhook 또는 일일 1회 cron으로 JSON-LD 자동 업데이트

### 포지셔닝
- Chatsio = "상품 데이터 인프라" (AI 인용은 첫 번째 use case)

## Security (🔴)
- 인증/결제/OAuth 토큰 코드 → `/careful` + `/freeze` + `payment-security` 에이전트 필수
- 나머지 코드 (대시보드, 추출, UI) → `/review` + `/cso` 충분
- OAuth 토큰 AES-256 암호화 저장
- Supabase RLS 필수 (예외 없음)
- n8n 자동화: AI 분석에만 사용, 인증/결제에는 사용 금지

## Coding Standards
- Global: `~/.claude/rules/` (자동 로드)
- TypeScript strict: true, `any` 금지
- Prettier + ESLint 필수
- OST: 타입/상수는 한 곳에서만 정의
- 모듈형 폴더: `features/` 간 직접 import 금지

## Verification (커밋 전 필수)
```bash
pnpm typecheck && pnpm lint && pnpm build && pnpm test
```

## Build Commands
```bash
pnpm dev          # Development
pnpm build        # Production build
pnpm test         # Unit tests (vitest)
pnpm test:e2e     # E2E tests (Playwright)
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm validate     # typecheck + lint + build + test
pnpm validate:pr  # validate + audit + e2e
```

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

---
Generated from `~/.claude/templates/` on 2026-04-05 | Updated with CEO+Eng Review on 2026-04-05
