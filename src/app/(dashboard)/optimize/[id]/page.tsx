import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared";
import { getOptimization } from "@/features/optimize";
import { OptimizationStatus } from "@/features/optimize/components/optimization-status";

interface OptimizationDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function OptimizationDetailPage({
  params,
}: OptimizationDetailPageProps): Promise<React.ReactElement> {
  const { id } = await params;

  // uuid 형식 사전 검증 — 잘못된 id는 DB 조회 없이 거부
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return <NotFoundState />;
  }

  const result = await getOptimization(id);

  if (!result.success || !result.optimization) {
    return <NotFoundState message={result.error ?? undefined} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="최적화 진행 상황"
        description="AI가 상품 데이터를 구조화하는 과정입니다."
      />
      <OptimizationStatus initialOptimization={result.optimization} />
    </div>
  );
}

function NotFoundState({ message }: { message?: string }): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader title="최적화 진행 상황" description="" />
      <div className="rounded-3xl border-2 border-dashed border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-16 text-center">
        <p className="text-base font-bold text-[var(--on-surface)]">
          최적화를 찾을 수 없습니다
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--on-surface-variant)]">
          {message ??
            "요청하신 최적화가 존재하지 않거나 접근 권한이 없습니다."}
        </p>
        <div className="mt-6">
          <Link href="/optimize">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" />
              최적화 실행으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
