---
globs: "**/*.ts,**/*.tsx"
---
# TypeScript 규칙
- any 타입 절대 금지 → unknown + 타입가드
- 타입 정의는 types/ 에서만 (OST), 다른 곳은 import
- 함수 반환 타입 명시 필수
- try-catch에서 구체적 에러 처리 (console.log만 금지)
- 파라미터 3개 초과 → 객체로 묶기
- Early Return 패턴 사용
