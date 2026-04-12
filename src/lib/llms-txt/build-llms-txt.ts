/**
 * llms.txt 빌드 유틸 — 쇼핑몰 정보 + 최적화된 상품 목록 → llms.txt 텍스트 생성.
 *
 * llms.txt는 AI 검색엔진(ChatGPT, Perplexity 등)이 쇼핑몰/상품 정보를
 * 구조적으로 읽을 수 있도록 제공하는 텍스트 파일 표준.
 *
 * Chatsio 차별점: 카페24 llms.txt는 쇼핑몰 전체 소개 수준이지만,
 * Chatsio는 SKU 단위 구조화 데이터(제목, 설명, 키워드, FAQ)를 포함.
 */

// ============================================================
// 타입
// ============================================================

interface ShopInfo {
  readonly name: string;
  readonly url: string;
  readonly industry: string;
}

interface FaqItem {
  readonly question?: string;
  readonly q?: string;
  readonly answer?: string;
  readonly a?: string;
}

interface OptimizedProduct {
  readonly productName: string;
  readonly productUrl: string | null;
  readonly plan: string;
  readonly score: number | null;
  readonly resultJson: {
    readonly optimized_title?: string;
    readonly optimized_description?: string;
    readonly product_type?: string;
    readonly keywords?: readonly string[];
    readonly faqs?: readonly FaqItem[];
    readonly target_audience?: string;
    readonly [key: string]: unknown;
  } | null;
}

// ============================================================
// 업종 한글 매핑
// ============================================================

const INDUSTRY_LABELS: Record<string, string> = {
  clothing: "의류",
  food: "식품",
  beauty: "뷰티",
  electronics: "전자기기",
  home: "생활/인테리어",
  sports: "스포츠/레저",
  kids: "유아/아동",
  pet: "반려동물",
  other: "기타",
};

// ============================================================
// 빌드 함수
// ============================================================

export function buildLlmsTxt({
  shop,
  products,
}: {
  readonly shop: ShopInfo;
  readonly products: readonly OptimizedProduct[];
}): string {
  const lines: string[] = [];
  const now = new Date().toISOString().split("T")[0];

  // 헤더
  lines.push(`# ${shop.name}`);
  lines.push(`> ${shop.name}의 상품 정보 — AI 검색엔진 최적화 데이터`);
  lines.push("");

  // 쇼핑몰 정보
  lines.push("## 쇼핑몰 정보");
  lines.push(`- URL: ${shop.url}`);
  lines.push(`- 업종: ${INDUSTRY_LABELS[shop.industry] ?? shop.industry}`);
  lines.push(`- 최적화 상품 수: ${products.length}개`);
  lines.push(`- 생성일: ${now}`);
  lines.push(`- 생성 도구: Chatsio (https://chatsio.com)`);
  lines.push("");

  // 상품 없으면 여기서 종료
  if (products.length === 0) {
    lines.push("## 상품 목록");
    lines.push("아직 최적화된 상품이 없습니다.");
    return lines.join("\n");
  }

  // 상품 목록
  lines.push("## 상품 목록");
  lines.push("");

  for (const product of products) {
    const r = product.resultJson;
    if (!r) continue;

    const title = r.optimized_title ?? product.productName;
    lines.push(`### ${title}`);

    if (product.productUrl) {
      lines.push(`- URL: ${product.productUrl}`);
    }
    if (r.product_type) {
      lines.push(`- 카테고리: ${r.product_type}`);
    }
    if (r.target_audience) {
      lines.push(`- 타겟 고객: ${r.target_audience}`);
    }
    if (r.optimized_description) {
      lines.push(`- 설명: ${r.optimized_description}`);
    }
    if (r.keywords && r.keywords.length > 0) {
      lines.push(`- 키워드: ${r.keywords.join(", ")}`);
    }

    // FAQ — 최대 5개
    const faqs = r.faqs ?? [];
    if (faqs.length > 0) {
      lines.push("- FAQ:");
      for (const faq of faqs.slice(0, 5)) {
        const q = faq.question ?? faq.q ?? "";
        const a = faq.answer ?? faq.a ?? "";
        if (q && a) {
          lines.push(`  - Q: ${q}`);
          lines.push(`    A: ${a}`);
        }
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}
