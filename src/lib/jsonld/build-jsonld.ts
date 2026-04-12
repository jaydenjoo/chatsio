/**
 * JSON-LD 빌드 유틸 — result_json → JSON-LD 재생성.
 *
 * n8n V10 B2/P7 최종정리 노드의 JSON-LD 조립 로직을 Next.js 측에 재현.
 * 사용자가 속성을 수정한 뒤 JSON-LD를 다시 만들 때 사용한다.
 */

import type { OptimizationPlan } from "@/features/optimize/validation";

// ============================================================
// 타입
// ============================================================

interface ProductMeta {
  readonly productUrl: string;
  readonly images: readonly string[];
  readonly brand: string;
  readonly category: string;
  readonly price: number;
}

interface FaqItem {
  readonly question?: string;
  readonly q?: string;
  readonly answer?: string;
  readonly a?: string;
}

interface ResultJson {
  readonly optimized_title?: string;
  readonly optimized_description?: string;
  readonly product_type?: string;
  readonly keywords?: readonly string[];
  readonly faqs?: readonly FaqItem[];
  readonly [key: string]: unknown;
}

interface JsonLdGraph {
  readonly "@context": string;
  readonly "@graph": readonly Record<string, unknown>[];
}

// ============================================================
// 빌드 함수
// ============================================================

export function buildJsonLd({
  resultJson,
  plan,
  meta,
}: {
  readonly resultJson: ResultJson;
  readonly plan: OptimizationPlan;
  readonly meta: ProductMeta;
}): JsonLdGraph {
  const productName = resultJson.optimized_title ?? "";
  const productDesc = resultJson.optimized_description ?? "";

  // Product 노드 — 빈 값 필드는 생략 (Google Rich Results 에러 방지)
  const product: Record<string, unknown> = {
    "@type": "Product",
    name: productName,
    description: productDesc,
  };

  if (meta.images.length > 0) {
    product.image = meta.images;
  }

  if (meta.brand) {
    product.brand = { "@type": "Brand", name: meta.brand };
  }

  const cat = (meta.category || resultJson.product_type || "").trim();
  if (cat) {
    product.category = cat;
  }

  // Offer — price가 0 이하이면 생략
  const offer: Record<string, unknown> = {
    "@type": "Offer",
    priceCurrency: "KRW",
    availability: "https://schema.org/InStock",
    url: meta.productUrl,
  };
  if (meta.price > 0) {
    offer.price = meta.price;
  }
  product.offers = offer;

  // Keywords
  const keywords = resultJson.keywords ?? [];
  if (keywords.length > 0) {
    product.keywords = keywords.join(", ");
  }

  // FAQ 노드
  const faqs = resultJson.faqs ?? [];
  const faqNode: Record<string, unknown> = {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question ?? f.q ?? "",
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer ?? f.a ?? "",
      },
    })),
  };

  // Basic: 2노드, Premium: 3노드 (+WebPage/SpeakableSpec)
  const graph: Record<string, unknown>[] = [product, faqNode];

  if (plan === "premium") {
    graph.push({
      "@type": "WebPage",
      name: productName,
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [
          ".product-title",
          ".product-description",
          ".faq-answer",
        ],
      },
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
