// ============================================================
// 인용 파싱 + 스코어 계산 — 순수 함수 (I/O 없음)
// ============================================================

export interface CitationMatch {
  readonly isCited: boolean;
  readonly matchedName: boolean;
  readonly matchedUrl: boolean;
}

/**
 * 한국어 텍스트 정규화: 공백/특수문자 제거, 소문자 변환.
 * 이름 매칭에서 "남성 오버핏 반팔" vs "남성  오버핏  반팔" 같은 차이를 무시.
 */
export function normalizeKorean(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s\-_\.·,()（）【】\[\]'"]/g, "");
}

/**
 * URL 정규화: 프로토콜 + trailing slash 제거.
 * "https://shop.com/product/123/" → "shop.com/product/123"
 */
function normalizeUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

/**
 * ChatGPT 응답에서 상품 인용 여부를 파싱한다.
 *
 * - 이름 매칭: 정규화 후 서브스트링 포함 여부
 * - URL 매칭: 도메인+경로 포함 여부 (프로토콜 제거)
 */
export function parseCitation(
  response: string,
  productName: string,
  productUrl: string | null,
): CitationMatch {
  const normalizedResponse = normalizeKorean(response);
  const normalizedName = normalizeKorean(productName);

  // 이름 매칭: 전체 이름 or 앞 6자 (한국어 상품명 축약 대응)
  const matchedName =
    normalizedResponse.includes(normalizedName) ||
    (normalizedName.length > 6 &&
      normalizedResponse.includes(normalizedName.slice(0, 6)));

  // URL 매칭
  let matchedUrl = false;
  if (productUrl) {
    const normalizedProductUrl = normalizeUrl(productUrl);
    const responseLower = response.toLowerCase();
    // 전체 URL 경로 매칭 (도메인 단독은 false positive 위험으로 제외)
    matchedUrl = responseLower.includes(normalizedProductUrl);
  }

  return {
    isCited: matchedName || matchedUrl,
    matchedName,
    matchedUrl,
  };
}

/**
 * Citation Score 계산 (0~100).
 *
 * | 조건                    | 점수 |
 * |-------------------------|------|
 * | URL + 이름 모두 매칭    | 100  |
 * | URL만 매칭              | 80   |
 * | 이름만 매칭             | 60   |
 * | 미인용                  | 0    |
 */
export function computeScore(match: CitationMatch): number {
  if (!match.isCited) return 0;
  if (match.matchedUrl && match.matchedName) return 100;
  if (match.matchedUrl) return 80;
  return 60; // matchedName only
}

/**
 * 여러 질문의 점수로 상품 종합 스코어를 계산한다.
 */
export function computeProductScore(scores: readonly number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round(sum / scores.length);
}
