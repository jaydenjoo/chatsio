import Link from "next/link";
import { Package, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { getOptimizationProducts } from "@/features/optimize";
import { OptimizeForm } from "@/features/optimize/components/optimize-form";

interface OptimizePageProps {
  readonly searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}

export default async function OptimizePage({
  searchParams,
}: OptimizePageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const rawProductId = params.productId;
  const preselectedProductId =
    typeof rawProductId === "string" ? rawProductId : undefined;

  const result = await getOptimizationProducts(preselectedProductId);

  if (!result.success) {
    return <ErrorState message={result.error ?? "알 수 없는 오류"} />;
  }

  if (result.products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI 최적화 실행"
        description="상품과 플랜을 선택하면 AI가 검색 최적화 데이터를 생성합니다."
      />

      <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] sm:p-8">
        <OptimizeForm
          products={result.products}
          preselectedProductId={result.preselectedProductId}
        />
      </div>
    </div>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <div className="space-y-8">
      <PageHeader
        title="AI 최적화 실행"
        description="상품과 플랜을 선택하면 AI가 검색 최적화 데이터를 생성합니다."
      />

      <div className="rounded-3xl border-2 border-dashed border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-16 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[var(--primary-fixed)]/40 text-[var(--primary)]">
          <Package className="size-7" />
        </div>
        <h2 className="mt-6 text-lg font-bold text-[var(--on-surface)]">
          먼저 상품을 등록해주세요
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--on-surface-variant)]">
          최적화를 실행하려면 상품이 필요합니다. 상품을 등록한 뒤 이 페이지로
          돌아오세요.
        </p>
        <div className="mt-6">
          <Link href="/products/new">
            <Button className="gap-2 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] shadow-lg hover:scale-[1.02] transition-transform">
              <Sparkles className="size-4" />
              상품 등록하러 가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }): React.ReactElement {
  return (
    <div className="space-y-8">
      <PageHeader title="AI 최적화 실행" description="" />
      <div className="rounded-2xl border border-[var(--error)]/40 bg-[var(--error)]/5 p-6 text-sm text-[var(--error)]">
        {message}
      </div>
    </div>
  );
}
