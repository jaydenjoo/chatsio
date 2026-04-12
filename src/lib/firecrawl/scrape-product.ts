/**
 * Firecrawl 상품 페이지 크롤링 + 메타데이터 추출.
 *
 * 상품 URL에서 HTML을 가져와 og:image, product:price:amount 등
 * 메타태그를 파싱하여 팩트 데이터를 반환한다.
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

    if (!html) {
      console.error("[Firecrawl] empty HTML returned");
      return null;
    }

    return extractProductMeta(html);
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

// ── HTML 메타태그 추출 ──────────────────────────────────────

function extractProductMeta(html: string): CrawledProductMeta {
  return {
    images: extractImages(html),
    price: extractPrice(html),
    currency: extractMetaContent(html, "product:price:currency") || "KRW",
    brand: extractMetaContent(html, "product:brand")
      || extractMetaContent(html, "og:brand")
      || "",
    category: extractCategory(html),
  };
}

/** og:image + product:image 메타태그에서 이미지 URL 추출 */
function extractImages(html: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  // og:image (가장 보편적)
  for (const url of matchMetaContents(html, "og:image")) {
    if (url && !seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
  }

  // product:image (일부 플랫폼)
  for (const url of matchMetaContents(html, "product:image")) {
    if (url && !seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
  }

  return images;
}

/**
 * 가격 추출 — 우선순위:
 * 1. product:price:amount 메타태그
 * 2. product:sale_price:amount 메타태그
 * 3. 페이지 내 기존 JSON-LD의 offers.price
 */
function extractPrice(html: string): number | null {
  // 1. product:price:amount
  const priceStr = extractMetaContent(html, "product:price:amount");
  if (priceStr) {
    const parsed = parseKoreanPrice(priceStr);
    if (parsed !== null) return parsed;
  }

  // 2. product:sale_price:amount (할인가 우선)
  const saleStr = extractMetaContent(html, "product:sale_price:amount");
  if (saleStr) {
    const parsed = parseKoreanPrice(saleStr);
    if (parsed !== null) return parsed;
  }

  // 3. JSON-LD offers.price
  const jsonLdPrice = extractJsonLdPrice(html);
  if (jsonLdPrice !== null) return jsonLdPrice;

  return null;
}

/** 카테고리 추출 — product:category 메타태그 또는 BreadcrumbList JSON-LD */
function extractCategory(html: string): string {
  // 1. product:category 메타태그
  const meta = extractMetaContent(html, "product:category");
  if (meta) return meta.trim();

  // 2. BreadcrumbList JSON-LD
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

// ── 유틸 ────────────────────────────────────────────────────

/** 특정 property의 메타태그 content 값 1개 반환 */
function extractMetaContent(html: string, property: string): string {
  // <meta property="X" content="Y"> 또는 <meta content="Y" property="X">
  const pattern1 = new RegExp(
    `<meta[^>]+property=["']${escapeRegex(property)}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const pattern2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escapeRegex(property)}["']`,
    "i",
  );

  const m = html.match(pattern1) ?? html.match(pattern2);
  return m?.[1]?.trim() ?? "";
}

/** 특정 property의 메타태그 content 값 여러 개 반환 */
function matchMetaContents(html: string, property: string): string[] {
  const results: string[] = [];
  const pattern = new RegExp(
    `<meta[^>]+property=["']${escapeRegex(property)}["'][^>]+content=["']([^"']+)["']`,
    "gi",
  );
  const pattern2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escapeRegex(property)}["']`,
    "gi",
  );

  for (const m of html.matchAll(pattern)) {
    if (m[1]) results.push(m[1].trim());
  }
  for (const m of html.matchAll(pattern2)) {
    if (m[1] && !results.includes(m[1].trim())) results.push(m[1].trim());
  }

  return results;
}

/** JSON-LD에서 offers.price 추출 */
function extractJsonLdPrice(html: string): number | null {
  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const match of scripts) {
    if (!match[1]) continue;
    try {
      const ld: unknown = JSON.parse(match[1]);
      if (typeof ld !== "object" || ld === null) continue;

      const obj = ld as Record<string, unknown>;
      // Product type with offers
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

/** 한국 가격 문자열 파싱 — "39,000", "39000", "₩39,000" 등 */
function parseKoreanPrice(raw: string): number | null {
  const cleaned = raw.replace(/[₩,\s원]/g, "").trim();
  const num = parseFloat(cleaned);
  return !isNaN(num) && num > 0 ? num : null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
