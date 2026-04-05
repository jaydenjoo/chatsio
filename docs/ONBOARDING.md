# nextjs Onboarding Guide

> 새로운 AI 에이전트(또는 사람)가 이 프로젝트에 합류할 때 읽을 문서.

## 1. 프로젝트 이해
- **목적**: 쇼핑몰의 품을 ai가 인용할수있게 jsom파일정리하는 솔루션
- **보안 등급**: 🟡 보통 (외부API/대외비)
- **핵심 규칙**: `.claude/CLAUDE.md` 필독

## 2. 환경 설정
```bash
# Node 버전 확인 (20+)
node -v

# 의존성 설치
cd /Users/jayden/project/nextjs
pnpm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 수정

# 개발 서버
pnpm dev
```

## 3. 필수 읽기 파일
1. `.claude/CLAUDE.md` — 프로젝트 규칙
2. `docs/ARCHITECTURE.md` — 시스템 구조
3. `docs/PROGRESS.md` — 최근 작업 히스토리
4. `docs/learnings.md` — 실수 패턴

## 4. 코딩 규칙 요약
- TypeScript strict, `any` 금지
- OST: 타입/상수 한 곳에서만 정의
- 커밋: conventional commits (`feat:`, `fix:`, `security:` 등)
- 검증: `tsc → eslint → build → test`

## 5. 작업 시작 전 체크
- [ ] PROGRESS.md에 세션 기록 추가
- [ ] 보안 등급 확인 (🔴이면 Plan 필수)
- [ ] 관련 learnings.md 항목 확인
