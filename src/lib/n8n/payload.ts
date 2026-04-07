/**
 * n8n V8 워크플로우 Webhook 페이로드 정규화.
 *
 * `1. 데이터 정규화` 노드의 입력 구조와 일치해야 한다. 누락된 필드는
 * n8n 코드에서 빈 문자열/null로 fallback되므로 MVP에서는 현재
 * products 테이블에 없는 컬럼(brand/category/가격)을 null로 넘긴다.
 *
 * Phase 6 Cafe24 연동 시 products 테이블이 풍부해지면 여기서 채운다.
 */

export interface N8nOptimizationPayload {
  readonly order_id: string;
  readonly idempotency_key: string;
  readonly product_id: string;
  readonly shop_id: string;
  readonly plan: "basic" | "premium";
  readonly product_name: string;
  readonly product_url: string;
  readonly image_urls: string[];
  readonly source: string;
  readonly industry: string;
  readonly brand: string;
  readonly category: string;
  readonly original_price: number | null;
  readonly discount_price: number | null;
}

export interface BuildN8nPayloadInput {
  readonly idempotencyKey: string;
  readonly plan: "basic" | "premium";
  readonly product: {
    readonly id: string;
    readonly name: string;
    readonly url: string | null;
    readonly imageUrls: string[] | null;
    readonly source: string;
  };
  readonly shop: {
    readonly id: string;
    readonly industry: string;
  };
}

export function buildN8nPayload(
  input: BuildN8nPayloadInput,
): N8nOptimizationPayload {
  return {
    // order_id는 n8n 정규화 노드가 idempotency_key로 fallback 소스로 사용.
    // 명시적으로 동일 값을 보낸다 → 양쪽 경로 모두 정확.
    order_id: input.idempotencyKey,
    idempotency_key: input.idempotencyKey,
    product_id: input.product.id,
    shop_id: input.shop.id,
    plan: input.plan,
    product_name: input.product.name,
    product_url: input.product.url ?? "",
    image_urls: input.product.imageUrls ?? [],
    source: input.product.source,
    industry: input.shop.industry,
    // 현재 products 테이블에 없는 필드 — Phase 6 Cafe24 연동 시 채움
    brand: "",
    category: "",
    original_price: null,
    discount_price: null,
  };
}
