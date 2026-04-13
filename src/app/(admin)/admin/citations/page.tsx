import { Search, BarChart3, CheckCircle, Activity } from "lucide-react";
import type { ReactElement } from "react";
import { KPICard } from "@/components/shared";
import {
  getOptimizedProducts,
  getCitationResults,
} from "@/features/admin/actions/citation-actions";
import { CitationRunner } from "@/features/admin/components/citation-runner";

export const dynamic = "force-dynamic";

// ============================================================
// 헬퍼
// ============================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// 페이지
// ============================================================

export default async function AdminCitationsPage(): Promise<ReactElement> {
  const [productsResult, resultsResult] = await Promise.all([
    getOptimizedProducts(),
    getCitationResults(),
  ]);

  const products = productsResult.data ?? [];
  const history = resultsResult.data ?? [];
  const hasError = !productsResult.success || !resultsResult.success;

  // KPI 집계
  const totalRuns = history.length;
  const avgScore = totalRuns > 0
    ? Math.round(history.reduce((sum, r) => sum + r.avgScore, 0) / totalRuns)
    : 0;
  const citedRuns = history.filter((r) => r.citedCount > 0).length;
  const citationRate = totalRuns > 0
    ? Math.round((citedRuns / totalRuns) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
          AI 인용 추적 PoC
        </h1>
        <p className="mt-1 text-on-surface-variant">
          상품별 질문을 생성하고, ChatGPT에 질의하여 인용 여부를 확인합니다.
        </p>
      </div>

      {/* 에러 알림 */}
      {hasError && (
        <div className="mb-6 rounded-xl bg-error-container/30 px-5 py-3 text-sm text-on-error-container">
          일부 데이터를 불러오지 못했습니다.
        </div>
      )}

      {/* KPI 카드 */}
      {totalRuns > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="평균 Citation Score"
            value={String(avgScore)}
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <KPICard
            label="인용률"
            value={`${citationRate}%`}
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <KPICard
            label="총 추적 횟수"
            value={`${totalRuns}회`}
            icon={<Search className="h-5 w-5" />}
          />
          <KPICard
            label="추적 대상 상품"
            value={`${products.length}개`}
            icon={<Activity className="h-5 w-5" />}
          />
        </div>
      )}

      {/* 실행 패널 */}
      {products.length > 0 ? (
        <div className="mb-8">
          <CitationRunner products={products} />
        </div>
      ) : (
        <div className="mb-8 rounded-2xl bg-surface-container-lowest px-6 py-12 text-center shadow-[var(--shadow-sm)]">
          <Search className="mx-auto h-10 w-10 text-outline/40" />
          <h3 className="mt-3 font-display text-lg font-bold text-on-surface">
            추적 가능한 상품이 없습니다
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            먼저 상품을 최적화(Phase 2)한 후 인용 추적을 실행하세요.
          </p>
        </div>
      )}

      {/* 이력 테이블 */}
      {history.length > 0 && (
        <div className="rounded-2xl bg-surface-container-lowest shadow-[var(--shadow-sm)]">
          <div className="border-b border-outline-variant/10 px-6 py-4">
            <h3 className="font-display text-lg font-bold text-on-surface">
              추적 이력
            </h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              최근 실행 기록 (최대 40건)
            </p>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 text-xs font-bold uppercase tracking-wider text-outline">
                <th className="px-6 py-3">상품</th>
                <th className="px-6 py-3">쇼핑몰</th>
                <th className="px-6 py-3 text-center">인용</th>
                <th className="px-6 py-3 text-center">질문 수</th>
                <th className="px-6 py-3 text-right">점수</th>
                <th className="hidden px-6 py-3 md:table-cell">실행일</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr
                  key={row.runId}
                  className="border-b border-outline-variant/5 transition-colors hover:bg-surface-container-low/50"
                >
                  <td className="max-w-[200px] truncate px-6 py-3 font-semibold text-on-surface">
                    {row.productName}
                  </td>
                  <td className="px-6 py-3 text-on-surface-variant">
                    {row.shopName}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      row.citedCount > 0
                        ? "bg-success/10 text-success"
                        : "bg-outline/10 text-outline"
                    }`}>
                      {row.citedCount}/{row.totalCount}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center text-on-surface-variant">
                    {row.totalCount}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className={`font-display text-lg font-extrabold ${
                      row.avgScore >= 60
                        ? "text-success"
                        : row.avgScore > 0
                          ? "text-warning"
                          : "text-outline"
                    }`}>
                      {row.avgScore}
                    </span>
                  </td>
                  <td className="hidden px-6 py-3 text-on-surface-variant md:table-cell">
                    {formatDate(row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
