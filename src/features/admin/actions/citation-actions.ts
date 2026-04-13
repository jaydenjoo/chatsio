"use server";

import { requireAdmin } from "@/features/admin/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateCitationQuestions,
  type GenerateQuestionsInput,
} from "@/lib/citations/claude-client";
import { queryChatGpt } from "@/lib/citations/openai-client";
import { parseCitation, computeScore, computeProductScore } from "@/lib/citations/parser";

// ============================================================
// 타입
// ============================================================

interface ActionResult<T> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

export interface CitationQuestionRow {
  readonly productId: string;
  readonly productName: string;
  readonly shopName: string;
  readonly questions: readonly string[];
  readonly generatedBy: string;
  readonly createdAt: string;
}

export interface CitationCheckResult {
  readonly runId: string;
  readonly productScore: number;
  readonly results: readonly CitationResultRow[];
}

export interface CitationResultRow {
  readonly questionText: string;
  readonly aiResponse: string;
  readonly isCited: boolean;
  readonly matchedName: boolean;
  readonly matchedUrl: boolean;
  readonly citationScore: number;
}

export interface CitationSummaryRow {
  readonly runId: string;
  readonly productId: string;
  readonly productName: string;
  readonly shopName: string;
  readonly avgScore: number;
  readonly citedCount: number;
  readonly totalCount: number;
  readonly createdAt: string;
}

// ============================================================
// 1. 질문 생성
// ============================================================

/** 상품의 구조화 데이터를 기반으로 구매 의도 질문 5개를 생성한다. */
export async function generateQuestions(
  productId: string,
): Promise<ActionResult<CitationQuestionRow>> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  // 상품 + 최적화 결과 조회
  const { data: product, error: productError } = await auth.ctx.supabase
    .from("products")
    .select("id, name, url, shop_id, shops(name)")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product) {
    return { success: false, error: "상품을 찾을 수 없습니다." };
  }

  // 최적화된 데이터가 있으면 속성 활용
  const { data: optimization } = await auth.ctx.supabase
    .from("optimizations")
    .select("result_json, jsonld")
    .eq("product_id", productId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const resultJson = optimization?.result_json as Record<string, unknown> | null;
  const jsonld = optimization?.jsonld as Record<string, unknown> | null;

  const input: GenerateQuestionsInput = {
    productName: product.name,
    productUrl: product.url ?? null,
    category: (jsonld?.["category"] as string) ?? (resultJson?.["category"] as string) ?? null,
    price: (jsonld?.["offers"] as Record<string, unknown>)?.["price"] as string ?? null,
    attributes: resultJson,
  };

  // Claude 질문 생성
  let questions: readonly string[];
  let model: string;
  try {
    const result = await generateCitationQuestions(input);
    questions = result.questions;
    model = result.model;
  } catch {
    return {
      success: false,
      error: "질문 생성에 실패했습니다. API 키와 네트워크 상태를 확인하세요.",
    };
  }

  // DB 저장 (upsert — 상품당 1세트)
  const admin = createAdminClient();
  const shopId = product.shop_id as string;

  const { error: upsertError } = await admin
    .from("citation_questions")
    .upsert(
      {
        product_id: productId,
        shop_id: shopId,
        questions,
        generated_by: model,
      },
      { onConflict: "product_id" },
    );

  if (upsertError) {
    return { success: false, error: "질문 저장에 실패했습니다." };
  }

  const shopRaw = product.shops;
  const shopName = (shopRaw && !Array.isArray(shopRaw))
    ? (shopRaw as { name: string }).name
    : "알 수 없음";

  return {
    success: true,
    data: {
      productId,
      productName: product.name,
      shopName,
      questions,
      generatedBy: model,
      createdAt: new Date().toISOString(),
    },
  };
}

// ============================================================
// 2. 인용 체크 실행
// ============================================================

/** 질문 5개를 ChatGPT에 질의하고 인용 여부를 파싱한다. */
export async function runCitationCheck(
  productId: string,
): Promise<ActionResult<CitationCheckResult>> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  // 질문 세트 조회
  const { data: questionRow, error: qError } = await auth.ctx.supabase
    .from("citation_questions")
    .select("questions, shop_id")
    .eq("product_id", productId)
    .maybeSingle();

  if (qError || !questionRow) {
    return { success: false, error: "먼저 질문을 생성해주세요." };
  }

  const rawQuestions: unknown = questionRow.questions;
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return { success: false, error: "저장된 질문이 비어있습니다." };
  }
  const questions = rawQuestions.filter((q): q is string => typeof q === "string" && q.length > 0);
  if (questions.length === 0) {
    return { success: false, error: "유효한 질문이 없습니다." };
  }

  // 상품 정보 (이름, URL)
  const { data: product } = await auth.ctx.supabase
    .from("products")
    .select("name, url")
    .eq("id", productId)
    .maybeSingle();

  if (!product) {
    return { success: false, error: "상품을 찾을 수 없습니다." };
  }

  const runId = crypto.randomUUID();
  const shopId = questionRow.shop_id as string;
  const results: CitationResultRow[] = [];
  const scores: number[] = [];

  // 질문별 순차 질의
  for (const question of questions) {
    try {
      const chatResult = await queryChatGpt(question);
      const match = parseCitation(chatResult.response, product.name, product.url ?? null);
      const score = computeScore(match);

      results.push({
        questionText: question,
        aiResponse: chatResult.response,
        isCited: match.isCited,
        matchedName: match.matchedName,
        matchedUrl: match.matchedUrl,
        citationScore: score,
      });
      scores.push(score);
    } catch (err) {
      // 개별 질문 실패 시 0점으로 기록
      const message = err instanceof Error ? err.message : "ChatGPT 질의 실패";
      results.push({
        questionText: question,
        aiResponse: `[오류] ${message}`,
        isCited: false,
        matchedName: false,
        matchedUrl: false,
        citationScore: 0,
      });
      scores.push(0);
    }
  }

  // DB 일괄 저장
  const admin = createAdminClient();
  const rows = results.map((r) => ({
    product_id: productId,
    shop_id: shopId,
    run_id: runId,
    question_text: r.questionText,
    ai_response: r.aiResponse,
    is_cited: r.isCited,
    matched_name: r.matchedName,
    matched_url: r.matchedUrl,
    citation_score: r.citationScore,
    model: "gpt-4o-mini",
  }));

  const { error: insertError } = await admin
    .from("citation_tracking")
    .insert(rows);

  if (insertError) {
    return { success: false, error: "결과 저장에 실패했습니다." };
  }

  const productScore = computeProductScore(scores);

  return {
    success: true,
    data: { runId, productScore, results },
  };
}

// ============================================================
// 3. 결과 조회
// ============================================================

/** 최근 인용 추적 결과 요약 목록 */
export async function getCitationResults(): Promise<ActionResult<readonly CitationSummaryRow[]>> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  const { data, error } = await auth.ctx.supabase
    .from("citation_tracking")
    .select("run_id, product_id, citation_score, is_cited, created_at, products(name), shops(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return { success: false, error: "결과를 불러올 수 없습니다." };
  }

  // run_id별 그룹핑
  const byRun = new Map<
    string,
    {
      productId: string;
      productName: string;
      shopName: string;
      scores: number[];
      citedCount: number;
      totalCount: number;
      createdAt: string;
    }
  >();

  for (const row of data ?? []) {
    const runId = row.run_id as string;
    const existing = byRun.get(runId);

    const productRaw = row.products;
    const shopRaw = row.shops;
    const productName = (productRaw && !Array.isArray(productRaw))
      ? (productRaw as { name: string }).name
      : "알 수 없음";
    const shopName = (shopRaw && !Array.isArray(shopRaw))
      ? (shopRaw as { name: string }).name
      : "알 수 없음";

    if (existing) {
      existing.scores.push(row.citation_score as number);
      if (row.is_cited) existing.citedCount += 1;
      existing.totalCount += 1;
    } else {
      byRun.set(runId, {
        productId: row.product_id as string,
        productName,
        shopName,
        scores: [row.citation_score as number],
        citedCount: row.is_cited ? 1 : 0,
        totalCount: 1,
        createdAt: row.created_at as string,
      });
    }
  }

  const result: CitationSummaryRow[] = [];
  for (const [runId, entry] of byRun) {
    result.push({
      runId,
      productId: entry.productId,
      productName: entry.productName,
      shopName: entry.shopName,
      avgScore: computeProductScore(entry.scores),
      citedCount: entry.citedCount,
      totalCount: entry.totalCount,
      createdAt: entry.createdAt,
    });
  }

  return { success: true, data: result };
}

/** 특정 run_id의 상세 결과 조회 */
export async function getCitationRunDetail(
  runId: string,
): Promise<ActionResult<readonly CitationResultRow[]>> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  const { data, error } = await auth.ctx.supabase
    .from("citation_tracking")
    .select("question_text, ai_response, is_cited, matched_name, matched_url, citation_score")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, error: "상세 결과를 불러올 수 없습니다." };
  }

  const rows: CitationResultRow[] = (data ?? []).map((r: Record<string, unknown>) => ({
    questionText: r.question_text as string,
    aiResponse: r.ai_response as string,
    isCited: r.is_cited as boolean,
    matchedName: r.matched_name as boolean,
    matchedUrl: r.matched_url as boolean,
    citationScore: r.citation_score as number,
  }));

  return { success: true, data: rows };
}

/** 최적화 완료된 상품 목록 (인용 추적 대상 후보) */
export async function getOptimizedProducts(): Promise<
  ActionResult<readonly { id: string; name: string; shopName: string }[]>
> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  // 최적화 완료된 상품 ID 조회
  const { data: optimizedRows, error: optError } = await auth.ctx.supabase
    .from("optimizations")
    .select("product_id")
    .eq("status", "completed");

  if (optError) {
    return { success: false, error: "최적화 이력을 불러올 수 없습니다." };
  }

  const optimizedIds = (optimizedRows ?? [])
    .map((r: Record<string, unknown>) => r.product_id as string)
    .filter(Boolean);

  if (optimizedIds.length === 0) {
    return { success: true, data: [] };
  }

  // 중복 제거
  const uniqueIds = [...new Set(optimizedIds)];

  const { data, error } = await auth.ctx.supabase
    .from("products")
    .select("id, name, shops(name)")
    .in("id", uniqueIds)
    .order("name");

  if (error) {
    return { success: false, error: "상품 목록을 불러올 수 없습니다." };
  }

  const result = (data ?? []).map((p: Record<string, unknown>) => {
    const shopRaw = p.shops;
    const shopName = (shopRaw && !Array.isArray(shopRaw))
      ? (shopRaw as { name: string }).name
      : "알 수 없음";
    return { id: p.id as string, name: p.name as string, shopName };
  });

  return { success: true, data: result };
}
