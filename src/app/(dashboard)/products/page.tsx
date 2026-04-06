import { Suspense } from "react";
import { Package, CheckCircle, TrendingUp, AlertTriangle, Plus, Upload } from "lucide-react";
import { getProducts } from "@/features/products";
import type { GetProductsInput } from "@/features/products";
import { PageHeader, KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProductSearchBar } from "@/features/products/components/product-search-bar";
import { ProductTable } from "@/features/products/components/product-table";
import { ProductEmptyState } from "@/features/products/components/product-empty-state";

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;

  const input: GetProductsInput = {
    query: typeof params.query === "string" ? params.query : undefined,
    status: typeof params.status === "string"
      ? (params.status as GetProductsInput["status"])
      : undefined,
    sort: typeof params.sort === "string"
      ? (params.sort as GetProductsInput["sort"])
      : undefined,
    page: typeof params.page === "string" ? parseInt(params.page, 10) || 1 : 1,
    limit: 20,
  };

  const result = await getProducts(input);
  const { products, total, kpi } = result;
  const hasProducts = kpi.total > 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <PageHeader
        title="상품 관리"
        description="등록된 상품을 관리하고 AI 최적화를 실행하세요"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" disabled>
              <Upload className="size-4" />
              CSV 업로드
            </Button>
            <Link href="/products/new">
              <Button className="gap-2 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] shadow-lg hover:scale-[1.02] transition-transform">
                <Plus className="size-4" />
                상품 추가
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards — Bento 비대칭 그리드 */}
      {hasProducts && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <KPICard
              label="전체 상품"
              value={kpi.total.toLocaleString()}
              icon={<Package className="size-5" />}
            />
          </div>
          <div className="lg:col-span-3">
            <KPICard
              label="최적화 완료"
              value={kpi.optimized.toLocaleString()}
              icon={<CheckCircle className="size-5" />}
              change={
                kpi.total > 0
                  ? {
                      value: Math.round((kpi.optimized / kpi.total) * 100),
                      trend: kpi.optimized > 0 ? "up" : "neutral",
                    }
                  : undefined
              }
            />
          </div>
          <div className="lg:col-span-2">
            <KPICard
              label="이번 주"
              value={kpi.thisWeek.toLocaleString()}
              icon={<TrendingUp className="size-5" />}
            />
          </div>
          <div className="lg:col-span-3">
            <KPICard
              label="수동확인 필요"
              value={kpi.manualReview.toLocaleString()}
              icon={<AlertTriangle className="size-5" />}
            />
          </div>
        </div>
      )}

      {/* 검색 + 필터 (상품이 있을 때만) */}
      {hasProducts && (
        <Suspense>
          <ProductSearchBar />
        </Suspense>
      )}

      {/* 테이블 또는 Empty State */}
      {products.length > 0 ? (
        <ProductTable
          products={products}
          total={total}
          page={input.page ?? 1}
          limit={input.limit ?? 20}
        />
      ) : hasProducts ? (
        <div className="bg-[var(--surface-container-lowest)] rounded-2xl p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
          <p className="text-[var(--on-surface-variant)]">
            검색 조건에 맞는 상품이 없습니다.
          </p>
        </div>
      ) : (
        <ProductEmptyState />
      )}
    </div>
  );
}
