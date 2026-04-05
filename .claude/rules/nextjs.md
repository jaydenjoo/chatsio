---
globs: "**/app/**,**/components/**,**/hooks/**"
---
# Next.js 15 규칙
- Server Component 기본, 'use client'는 필요할 때만
- 페이지 생성 시 error.tsx + loading.tsx 함께 생성
- Tailwind CSS만 사용 (인라인 style/CSS 모듈 금지)
- shadcn/ui 컴포넌트 우선 확인 → 없으면 직접 생성
- 폴더구조: app/(라우트), components/(UI), lib/(유틸), types/(타입OST), constants/(상수OST)
