/**
 * Firecrawl 상품 페이지 크롤링 + 메타데이터 추출.
 *
 * 2단계 추출:
 *  1차: Firecrawl metadata 객체 (Firecrawl이 이미 파싱한 메타태그)
 *  2차: raw HTML regex (1차에서 못 찾은 경우 fallback)
 *
 * API 실패 시 null 반환 (graceful degradation) — 최적화 플로우를 차단하지 않는다.
 */

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape";
const FIRECRAWL_TIMEOUT_MS = 15_000;

export interface CrawledProductMeta {
  readonly images: string[];
  readonly price: number | null;
  readonly currency: string;
  readonly brand: string;
  readonly category: string;
}

/**
 * 상품 URL을 Firecrawl로 크롤링하여 메타데이터를 추출한다.
 *
 * @returns 추출된 메타데이터 또는 null (크롤링 실패 시)
 */
export async function scrapeProductMeta(
  productUrl: string,
  apiKey: string,
): Promise<CrawledProductMeta | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FIRECRAWL_TIMEOUT_MS);

    const response = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ["html"],
        onlyMainContent: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("[Firecrawl] API error:", response.status);
      return null;
    }

    const json: unknown = await response.json();
    if (
      typeof json !== "object" ||
      json === null ||
      !("success" in json) ||
      !("data" in json)
    ) {
      console.error("[Firecrawl] unexpected response shape");
      return null;
    }

    const data = (json as Record<string, unknown>).data;
    if (typeof data !== "object" || data === null) return null;

    const html = typeof (data as Record<string, unknown>).html === "string"
      ? ((data as Record<string, unknown>).html as string)
      : "";

    // Firecrawl이 이미 파싱한 metadata 객체 — 1차 추출 소스
    const rawMetadata = (data as Record<string, unknown>).metadata;
    const metadata: Record<string, unknown> =
      typeof rawMetadata === "object" && rawMetadata !== null
        ? (rawMetadata as Record<string, unknown>)
        : {};

    return extractProductMeta(metadata, html);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error(`[Firecrawl] timeout (${FIRECRAWL_TIMEOUT_MS}ms)`);
    } else {
      console.error(
        "[Firecrawl] scrape failed:",
        err instanceof Error ? err.message : String(err),
      );
    }
    return null;
  }
}

// ── 2단계 추출: metadata 우선 → HTML fallback ───────────────

function extractProductMeta(
  metadata: Record<string, unknown>,
  html: string,
): CrawledProductMeta {
  return {
    images: extractImages(metadata, html),
    price: extractPrice(metadata, html),
    currency: metaStr(metadata, "product:price:currency")
      || extractHtmlMetaContent(html, "product:price:currency")
      || "KRW",
    brand: metaStr(metadata, "product:brand")
      || metaStr(metadata, "og:brand")
      || extractHtmlMetaContent(html, "product:brand")
      || "",
    category: extractCategory(metadata, html),
  };
}

/** 이미지 추출 — metadata.ogImage 우선, HTML fallback */
function extractImages(
  metadata: Record<string, unknown>,
  html: string,
): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  function addImage(url: string): void {
    const trimmed = url.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      images.push(trimmed);
    }
  }

  // 1차: Firecrawl metadata
  const ogImage = metaStr(metadata, "ogImage");
  if (ogImage) addImage(ogImage);

  // metadata의 og:image (일부 버전에서 키 이름이 다를 수 있음)
  const ogImage2 = metaStr(metadata, "og:image");
  if (ogImage2) addImage(ogImage2);

  // 2차: HTML fallback (metadata에서 못 찾은 경우)
  if (images.length === 0) {
    for (const url of matchHtmlMetaContents(html, "og:image")) {
      addImage(url);
    }
    for (const url of matchHtmlMetaContents(html, "product:image")) {
      addImage(url);
    }
  }

  return images;
}

/**
 * 가격 추출 — 우선순위:
 * 1. metadata product:sale_price:amount (할인가 우선)
 * 2. metadata product:price:amount (정가)
 * 3. HTML meta tag fallback
 * 4. 페이지 내 기존 JSON-LD의 offers.price
 */
function extractPrice(
  metadata: Record<string, unknown>,
  html: string,
): number | null {
  // 1. metadata 할인가 (실제 판매가)
  const salePriceStr = metaStr(metadata, "product:sale_price:amount");
  if (salePriceStr) {
    const parsed = parseKoreanPrice(salePriceStr);
    if (parsed !== null) return parsed;
  }

  // 2. metadata 정가
  const priceStr = metaStr(metadata, "product:price:amount");
  if (priceStr) {
    const parsed = parseKoreanPrice(priceStr);
    if (parsed !== null) return parsed;
  }

  // 3. HTML fallback
  const htmlPrice = extractHtmlMetaContent(html, "product:sale_price:amount")
    || extractHtmlMetaContent(html, "product:price:amount");
  if (htmlPrice) {
    const parsed = parseKoreanPrice(htmlPrice);
    if (parsed !== null) return parsed;
  }

  // 4. JSON-LD fallback
  return extractJsonLdPrice(html);
}

/** 카테고리 추출 — metadata → HTML meta → BreadcrumbList JSON-LD */
function extractCategory(
  metadata: Record<string, unknown>,
  html: string,
): string {
  // 1. metadata
  const metaCat = metaStr(metadata, "product:category");
  if (metaCat) return metaCat;

  // 2. HTML meta tag
  const htmlCat = extractHtmlMetaContent(html, "product:category");
  if (htmlCat) return htmlCat;

  // 3. BreadcrumbList JSON-LD
  if (!html) return "";

  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const match of scripts) {
    if (!match[1]) continue;
    try {
      const ld: unknown = JSON.parse(match[1]);
      if (
        typeof ld === "object" &&
        ld !== null &&
        (ld as Record<string, unknown>)["@type"] === "BreadcrumbList" &&
        Array.isArray((ld as Record<string, unknown>).itemListElement)
      ) {
        const items = (ld as Record<string, unknown>).itemListElement as Array<
          Record<string, unknown>
        >;
        const names = items
          .map((item) => (typeof item.name === "string" ? item.name : ""))
          .filter(Boolean);
        if (names.length > 0) return names.join(" > ");
      }
    } catch {
      // JSON 파싱 실패 — 무시
    }
  }

  return "";
}

// ── Firecrawl metadata 헬퍼 ─────────────────────────────────

/** metadata 객체에서 문자열 값 추출 (다양한 키 형식 대응) */
function metaStr(metadata: Record<string, unknown>, key: string): string {
  // 정확한 키 매칭
  const val = metadata[key];
  if (typeof val === "string" && val.trim()) return val.trim();

  // Firecrawl은 "product:price:amount" → "product:price:amount" 그대로 넣기도 하고
  // camelCase("productPriceAmount")로 넣기도 함. 둘 다 시도.
  const camelKey = key.replace(/[:\-](\w)/g, (_, c: string) => c.toUpperCase());
  const val2 = metadata[camelKey];
  if (typeof val2 === "string" && val2.trim()) return val2.trim();

  // 숫자인 경우 문자열로 변환
  if (typeof val === "number") return String(val);
  if (typeof val2 === "number") return String(val2);

  return "";
}

// ── HTML regex fallback ─────────────────────────────────────

/** HTML에서 특정 property의 메타태그 content 값 1개 반환 */
function extractHtmlMetaContent(html: string, property: string): string {
  if (!html) return "";

  // <meta property="X" content="Y"> 또는 <meta content="Y" property="X">
  // name="X"도 시도 (일부 쇼핑몰은 property 대신 name 사용)
  const escaped = escapeRegex(property);
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m?.[1]?.trim()) return m[1].trim();
  }

  return "";
}

/** HTML에서 특정 property의 메타태그 content 값 여러 개 반환 */
function matchHtmlMetaContents(html: string, property: string): string[] {
  if (!html) return [];

  const results: string[] = [];
  const escaped = escapeRegex(property);
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "gi"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`, "gi"),
  ];

  for (const pattern of patterns) {
    for (const m of html.matchAll(pattern)) {
      if (m[1] && !results.includes(m[1].trim())) results.push(m[1].trim());
    }
  }

  return results;
}

/** JSON-LD에서 offers.price 추출 */
function extractJsonLdPrice(html: string): number | null {
  if (!html) return null;

  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const match of scripts) {
    if (!match[1]) continue;
    try {
      const ld: unknown = JSON.parse(match[1]);
      if (typeof ld !== "object" || ld === null) continue;

      const obj = ld as Record<string, unknown>;
      if (obj["@type"] === "Product" && typeof obj.offers === "object" && obj.offers !== null) {
        const offers = obj.offers as Record<string, unknown>;
        const priceVal = offers.price ?? offers.lowPrice;
        if (typeof priceVal === "number" && priceVal > 0) return priceVal;
        if (typeof priceVal === "string") {
          const p = parseKoreanPrice(priceVal);
          if (p !== null) return p;
        }
      }
    } catch {
      // JSON 파싱 실패 — 다음 스크립트 시도
    }
  }

  return null;
}

// ── 공통 유틸 ───────────────────────────────────────────────

/** 한국 가격 문자열 파싱 — "39,000", "39000", "₩39,000" 등 */
function parseKoreanPrice(raw: string): number | null {
  const cleaned = raw.replace(/[₩,\s원]/g, "").trim();
  const num = parseFloat(cleaned);
  return !isNaN(num) && num > 0 ? num : null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
