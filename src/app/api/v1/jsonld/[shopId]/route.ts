import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/v1/jsonld/[shopId]?url=<product_url>
 *
 * 쇼핑몰 상품 URL에 매칭되는 JSON-LD를 반환.
 * Loader JS가 클라이언트에서 호출하는 엔드포인트.
 * CORS 허용 (외부 쇼핑몰에서 호출).
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> },
): Promise<NextResponse> {
  const { shopId } = await params;
  const productUrl = request.nextUrl.searchParams.get("url");

  if (!productUrl) {
    return NextResponse.json(
      { error: "url 파라미터가 필요합니다." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const supabase = createAdminClient();

  // 1차: products.url로 매칭
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("shop_id", shopId)
    .eq("url", productUrl)
    .limit(1)
    .maybeSingle();

  let optimization: { jsonld: unknown } | null = null;

  if (product) {
    const { data } = await supabase
      .from("optimizations")
      .select("jsonld")
      .eq("product_id", product.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    optimization = data;
  }

  // 2차: jsonld 안의 offers.url로 매칭 (products.url이 null인 경우)
  if (!optimization) {
    const { data, error: fallbackError } = await supabase
      .from("optimizations")
      .select("jsonld")
      .eq("shop_id", shopId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(50);

    if (fallbackError) {
      return NextResponse.json(
        { jsonld: null },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    // jsonld 안에서 offers.url이 productUrl과 매칭되는 행 찾기
    const match = (data ?? []).find((row: { jsonld: unknown }) => {
      const jsonld = row.jsonld as Record<string, unknown> | null;
      if (!jsonld) return false;
      const graph = jsonld["@graph"] as Record<string, unknown>[] | undefined;
      if (!graph) return false;
      const productNode = graph.find((n) => n["@type"] === "Product");
      const offers = productNode?.offers as Record<string, unknown> | undefined;
      const offersUrl = (offers?.url as string) ?? "";
      // URL 인코딩 차이 대응 — 디코딩 후 비교
      try {
        return decodeURIComponent(offersUrl) === decodeURIComponent(productUrl);
      } catch {
        return offersUrl === productUrl;
      }
    });

    // 3차 fallback: URL 경로 부분만 비교 (쿼리스트링/해시 제거 후)
    if (!match) {
      const normalizeUrl = (u: string): string => {
        try {
          const decoded = decodeURIComponent(u);
          const parsed = new URL(decoded);
          return parsed.pathname;
        } catch {
          return u;
        }
      };
      const targetPath = normalizeUrl(productUrl);
      const pathMatch = (data ?? []).find((row: { jsonld: unknown }) => {
        const jsonld = row.jsonld as Record<string, unknown> | null;
        if (!jsonld) return false;
        const graph = jsonld["@graph"] as Record<string, unknown>[] | undefined;
        if (!graph) return false;
        const pNode = graph.find((n) => n["@type"] === "Product");
        const off = pNode?.offers as Record<string, unknown> | undefined;
        const offUrl = (off?.url as string) ?? "";
        return normalizeUrl(offUrl) === targetPath;
      });
      optimization = pathMatch ?? null;
    } else {
      optimization = match;
    }
  }

  return NextResponse.json(
    { jsonld: optimization?.jsonld ?? null },
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
