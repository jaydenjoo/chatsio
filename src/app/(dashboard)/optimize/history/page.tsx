import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { getOptimizationHistory } from "@/features/optimize/actions";
import { OptimizationHistory } from "@/features/optimize/components/optimization-history";

export default async function OptimizeHistoryPage(): Promise<React.ReactElement> {
  const result = await getOptimizationHistory();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/optimize"
          className="flex size-10 items-center justify-center rounded-xl text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--surface-container-low)]"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <PageHeader
          title="최적화 이력"
          description="이전에 실행한 AI 최적화 결과를 확인할 수 있습니다."
        />
      </div>

      {result.success ? (
        <OptimizationHistory items={result.items} />
      ) : (
        <div className="rounded-2xl border border-[var(--error)]/40 bg-[var(--error)]/5 p-6 text-sm text-[var(--error)]">
          {result.error}
        </div>
      )}
    </div>
  );
}
