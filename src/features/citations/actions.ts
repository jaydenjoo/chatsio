"use server";

import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { computeProductScore } from "@/lib/citations/parser";

// ============================================================
// 타입
// ============================================================

interface ActionResult<T> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

export interface CitationProductSummary {
  readonly productId: string;
  readonly productName: string;
  readonly optimizationScore: number | null;
  readonly citationScore: number | null;
  readonly citedCount: number;
  readonly totalCount: number;
  readonly lastTrackedAt: string | null;
  readonly hasJsonLd: boolean;
}

export interface CitationDetailRow {
  readonly questionText: string;
  readonly aiResponse: string;
  readonly isCited: boolean;
  readonly matchedName: boolean;
  readonly matchedUrl: boolean;
  readonly citationScore: number;
  readonly createdAt: string;
}

// ============================================================
// 헬퍼 — 인증 + 쇼핑몰 확인
// ============================================================

async function getAuthenticatedShop(): Promise<
  ActionResult<{ supabase: Awaited<ReturnType<typeof createClient>>; shopId: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shop) {
    return { success: false, error: "쇼핑몰 정보가 없습니다." };
  }

  return { success: true, data: { supabase, shopId: shop.id } };
}

// ============================================================
// 1. 내 상품별 인용 요약
// ============================================================

export async function getMyCitationSummary(): Promise<
  ActionResult<readonly CitationProductSummary[]>
> {
  const auth = await getAuthenticatedShop();
  if (!auth.success || !auth.data) {
    return { success: false, error: auth.error };
  }

  const { supabase, shopId } = auth.data;

  // 내 상품 목록
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("id, name")
    .eq("shop_id", shopId);

  if (prodError || !products) {
    return { success: false, error: "상품 목록을 불러올 수 없습니다." };
  }

  if (products.length === 0) {
    return { success: true, data: [] };
  }

  const productIds = products.map((p: Record<string, unknown>) => p.id as string);

  // 최적화 결과 (최신 completed만, 상품 수 × 2 상한)
  const { data: optimizations } = await supabase
    .from("optimizations")
    .select("product_id, score, jsonld, created_at")
    .in("product_id", productIds)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(productIds.length * 2);

  // 인용 추적 결과 (최근 30일, 상품 수 × 10 상한)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const { data: citations } = await supabase
    .from("citation_tracking")
    .select("product_id, citation_score, is_cited, created_at, run_id")
    .in("product_id", productIds)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(productIds.length * 10);

  // 상품별 집계
  const result: CitationProductSummary[] = products.map((p: Record<string, unknown>) => {
    const pid = p.id as string;

    // 최신 최적화
    const latestOpt = (optimizations ?? []).find(
      (o: Record<string, unknown>) => o.product_id === pid,
    );

    // 최신 run의 인용 결과
    const productCitations = (citations ?? []).filter(
      (c: Record<string, unknown>) => c.product_id === pid,
    );
    const latestRunId = productCitations[0]
      ? (productCitations[0] as Record<string, unknown>).run_id
      : null;
    const latestRunRows = latestRunId
      ? productCitations.filter(
          (c: Record<string, unknown>) => c.run_id === latestRunId,
        )
      : [];

    const scores = latestRunRows.map(
      (c: Record<string, unknown>) => c.citation_score as number,
    );
    const citedCount = latestRunRows.filter(
      (c: Record<string, unknown>) => c.is_cited === true,
    ).length;

    return {
      productId: pid,
      productName: p.name as string,
      optimizationScore: latestOpt
        ? (latestOpt as Record<string, unknown>).score as number | null
        : null,
      citationScore: scores.length > 0 ? computeProductScore(scores) : null,
      citedCount,
      totalCount: latestRunRows.length,
      lastTrackedAt: productCitations[0]
        ? ((productCitations[0] as Record<string, unknown>).created_at as string)
        : null,
      hasJsonLd: latestOpt
        ? (latestOpt as Record<string, unknown>).jsonld != null
        : false,
    };
  });

  return { success: true, data: result };
}

// ============================================================
// 2. 특정 상품의 질문별 상세 결과
// ============================================================

export async function getMyCitationDetail(
  productId: string,
): Promise<ActionResult<readonly CitationDetailRow[]>> {
  const parsed = z.string().uuid().safeParse(productId);
  if (!parsed.success) {
    return { success: false, error: "잘못된 상품 ID입니다." };
  }

  const auth = await getAuthenticatedShop();
  if (!auth.success || !auth.data) {
    return { success: false, error: auth.error };
  }

  const { supabase, shopId } = auth.data;

  // 소유권 확인
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", parsed.data)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (!product) {
    return { success: false, error: "상품을 찾을 수 없습니다." };
  }

  // 최신 run_id 조회 후 해당 run 결과만 가져오기
  const { data: latestRow } = await supabase
    .from("citation_tracking")
    .select("run_id")
    .eq("product_id", parsed.data)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestRow) {
    return { success: true, data: [] };
  }

  const { data, error } = await supabase
    .from("citation_tracking")
    .select("question_text, ai_response, is_cited, matched_name, matched_url, citation_score, created_at")
    .eq("run_id", (latestRow as Record<string, unknown>).run_id as string)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, error: "결과를 불러올 수 없습니다." };
  }

  const rows: CitationDetailRow[] = (data ?? []).map((r: Record<string, unknown>) => ({
    questionText: r.question_text as string,
    aiResponse: r.ai_response as string,
    isCited: r.is_cited as boolean,
    matchedName: r.matched_name as boolean,
    matchedUrl: r.matched_url as boolean,
    citationScore: r.citation_score as number,
    createdAt: r.created_at as string,
  }));

  return { success: true, data: rows };
}
