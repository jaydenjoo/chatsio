---
globs: "**/auth/**,**/api/**,**/middleware*,**/payment*"
---
# 보안 규칙 (CRITICAL)
- AI 코드 ~40% 보안 취약 → 인증/결제/보안은 Jayden 직접 확인
- API 키/비밀번호 하드코딩 절대 금지
- 모든 사용자 입력: Zod 검증 필수
- API 라우트: 인증 체크 필수
- 에러 메시지에 시스템 내부 정보 노출 금지
