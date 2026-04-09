/**
 * onboarding_done 쿠키 공통 상수 — Session #16 Follow-up #3 / Task 2-M-B-2 이후
 *
 * ## 배경
 * proxy(`updateSession`)와 `completeOnboarding` Server Action 양쪽이
 * 동일한 캐싱 쿠키를 set한다. 기존에는 두 곳에 옵션이 하드코딩되어 있어
 * 한 곳만 수정되면 캐싱이 깨지는 동기화 위험이 있었음. 단일 출처로 분리.
 *
 * ## 성격: UX 캐싱 쿠키 (보안 경계 아님)
 * proxy가 매 요청마다 `user_profiles.onboarding_completed`를 조회하지
 * 않도록 1시간 캐싱. 실제 접근 제어는 `(dashboard)/layout.tsx` + proxy가
 * 매 요청 DB 검증하며, 이 쿠키는 오직 "DB 1회 조회 절약" 목적.
 *
 * ## 옵션 변경 시
 * 이 파일만 수정하면 양쪽 소비자에게 자동 반영된다. 이름/값/옵션 어느 하나도
 * 두 소비자 사이에 불일치가 있어선 안 된다 — 쿠키 set은 한쪽이 하고 read는
 * 다른 쪽이 하는 구조이기 때문.
 */

export const ONBOARDING_COOKIE_NAME = "onboarding_done";

export const ONBOARDING_COOKIE_VALUE = "1";

export const ONBOARDING_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 3600, // 1시간
} as const;
