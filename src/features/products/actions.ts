"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types
// ============================================================

export interface ProductRow {
  id: string;
  name: string;
  url: string | null;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ProductKpi {
  total: number;
  optimized: number;
  thisWeek: number;
  manualReview: number;
}

export interface GetProductsResult {
  success: boolean;
  error: string | null;
  products: ProductRow[];
  total: number;
  kpi: ProductKpi;
}

// ============================================================
// Zod 스키마
// ============================================================

const getProductsSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["all", "pending", "optimized", "failed", "manual_review"]).optional(),
  sort: z.enum(["newest", "oldest", "name"]).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type GetProductsInput = z.infer<typeof getProductsSchema>;

const createProductSchema = z.object({
  name: z.string().min(1, "상품명을 입력해주세요").max(200, "상품명은 200자 이하로 입력해주세요"),
  url: z
    .string()
    .url("올바른 상품 URL을 입력해주세요")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "http:// 또는 https:// URL만 허용됩니다",
    ),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export interface CreateProductResult {
  success: boolean;
  error: string | null;
  productId?: string;
}

// ============================================================
// Server Actions
// ============================================================

export async function getProducts(
  input?: GetProductsInput,
): Promise<GetProductsResult> {
  const parsed = getProductsSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return {
      success: false,
      error: "잘못된 요청입니다.",
      products: [],
      total: 0,
      kpi: { total: 0, optimized: 0, thisWeek: 0, manualReview: 0 },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "인증이 필요합니다.",
      products: [],
      total: 0,
      kpi: { total: 0, optimized: 0, thisWeek: 0, manualReview: 0 },
    };
  }

  // 현재 유저의 shop 조회
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shop) {
    return {
      success: true,
      error: null,
      products: [],
      total: 0,
      kpi: { total: 0, optimized: 0, thisWeek: 0, manualReview: 0 },
    };
  }

  const { query, status, sort, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  // KPI 쿼리 (전체 상품 기준)
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, status, created_at")
    .eq("shop_id", shop.id);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const items = allProducts ?? [];
  const kpi: ProductKpi = {
    total: items.length,
    optimized: items.filter((p: { status: string }) => p.status === "optimized").length,
    thisWeek: items.filter((p: { created_at: string }) => new Date(p.created_at) >= weekAgo).length,
    manualReview: items.filter((p: { status: string }) => p.status === "manual_review").length,
  };

  // 목록 쿼리 (필터 + 검색 + 정렬 + 페이지네이션)
  let listQuery = supabase
    .from("products")
    .select("id, name, url, status, source, created_at, updated_at", { count: "exact" })
    .eq("shop_id", shop.id);

  // 검색
  if (query) {
    listQuery = listQuery.or(`name.ilike.%${query}%,url.ilike.%${query}%`);
  }

  // 상태 필터
  if (status && status !== "all") {
    listQuery = listQuery.eq("status", status);
  }

  // 정렬
  switch (sort) {
    case "oldest":
      listQuery = listQuery.order("created_at", { ascending: true });
      break;
    case "name":
      listQuery = listQuery.order("name", { ascending: true });
      break;
    default:
      listQuery = listQuery.order("created_at", { ascending: false });
  }

  // 페이지네이션
  listQuery = listQuery.range(offset, offset + limit - 1);

  const { data: products, count, error } = await listQuery;

  if (error) {
    return {
      success: false,
      error: "상품 목록을 불러오는데 실패했습니다.",
      products: [],
      total: 0,
      kpi,
    };
  }

  return {
    success: true,
    error: null,
    products: (products as ProductRow[]) ?? [],
    total: count ?? 0,
    kpi,
  };
}

export async function createProduct(
  input: CreateProductInput,
): Promise<CreateProductResult> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "잘못된 요청입니다.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "인증이 필요합니다." };
  }

  // 현재 유저의 shop 조회 (온보딩 완료 여부)
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shop) {
    return { success: false, error: "쇼핑몰 정보가 없습니다. 온보딩을 먼저 완료해주세요." };
  }

  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      shop_id: shop.id,
      name: parsed.data.name,
      url: parsed.data.url,
      source: "url",
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: "상품 등록에 실패했습니다." };
  }

  revalidatePath("/products");

  return { success: true, error: null, productId: inserted.id };
}

export async function deleteProduct(productId: string): Promise<{ success: boolean; error: string | null }> {
  if (!productId) {
    return { success: false, error: "상품 ID가 필요합니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "인증이 필요합니다." };
  }

  // 소유권 검증: product → shop → user_id
  const { data: product } = await supabase
    .from("products")
    .select("id, shop_id")
    .eq("id", productId)
    .maybeSingle();

  if (!product) {
    return { success: false, error: "상품을 찾을 수 없습니다." };
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("id", product.shop_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shop) {
    return { success: false, error: "상품을 삭제할 권한이 없습니다." };
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return { success: false, error: "상품 삭제에 실패했습니다." };
  }

  revalidatePath("/products");

  return { success: true, error: null };
}
