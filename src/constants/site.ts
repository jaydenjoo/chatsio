/**
 * 사이트 전역 상수 — URL, 이름, 설명 등 단일 출처(OST).
 * 도메인 변경 시 여기만 수정하면 됨.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chatsio-topaz.vercel.app";

export const SITE_NAME = "Chatsio";

export const SITE_DESCRIPTION =
  "AI가 상품정보를 자동 구조화하고, AI 검색엔진 인용을 추적하는 SaaS";

export const SITE_DESCRIPTION_LONG =
  "URL만 연결하면 JSON-LD + llms.txt를 자동 생성하고 AI 검색엔진이 당신의 상품을 추천하는지 추적합니다.";
