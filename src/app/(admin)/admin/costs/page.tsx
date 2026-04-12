import { BarChart3, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import type { ReactElement } from "react";
import { CSVExport, KPICard } from "@/components/shared";
import {
  getCostKpi,
  getDailyStats,
  getCustomerCosts,
} from "@/features/admin/actions/cost-actions";
import { CostChart } from "@/features/admin/components/cost-chart";

// ============================================================
// 날짜 포맷
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

export default async function AdminCostsPage(): Promise<ReactElement> {
  const [kpiResult, dailyResult, customerResult] = await Promise.all([
    getCostKpi(),
    getDailyStats(),
    getCustomerCosts(),
  ]);

  const kpi = kpiResult.data;
  const dailyStats = dailyResult.data ?? [];
  const customers = customerResult.data ?? [];
  const hasError = !kpiResult.success || !dailyResult.success || !customerResult.success;

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
            AI 비용 모니터링
          </h1>
          <p className="mt-1 text-on-surface-variant">
            이번 달 API 호출 수와 추정 비용을 확인합니다.
          </p>
        </div>
        <CSVExport
          filename="AI비용"
          headers={["쇼핑몰", "Basic", "Premium", "총 호출", "추정 비용(원)", "마지막 사용"]}
          rows={customers.map((c) => [
            c.shopName,
            String(c.basicCount),
            String(c.premiumCount),
            String(c.totalCalls),
            String(c.estimatedCost),
            formatDate(c.lastUsed),
          ])}
        />
      </div>

      {/* 에러 알림 */}
      {hasError && (
        <div className="mb-6 rounded-xl bg-error-container/30 px-5 py-3 text-sm text-on-error-container">
          일부 데이터를 불러오지 못했습니다. 새로고침하거나 잠시 후 다시 시도해주세요.
        </div>
      )}

      {/* KPI 카드 */}
      {kpi && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="이번 달 총 호출"
            value={`${kpi.totalCalls}건`}
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <KPICard
            label="추정 비용"
            value={`₩${kpi.estimatedCost.toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <KPICard
            label="일 평균 호출"
            value={`${kpi.dailyAverage}건`}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <KPICard
            label="성공률"
            value={`${kpi.successRate}%`}
            icon={<CheckCircle className="h-5 w-5" />}
          />
        </div>
      )}

      {/* 일별 차트 */}
      <div className="mb-8">
        <CostChart stats={dailyStats} />
      </div>

      {/* 고객별 사용량 테이블 */}
      <div className="rounded-2xl bg-surface-container-lowest shadow-[var(--shadow-sm)]">
        <div className="border-b border-outline-variant/10 px-6 py-4">
          <h3 className="font-display text-lg font-bold text-on-surface">
            고객별 사용량
          </h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            이번 달 기준 · 추정 단가: Basic ₩150, Premium ₩800
          </p>
        </div>

        {customers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-outline">
            이번 달 사용 기록이 없습니다.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 text-xs font-bold uppercase tracking-wider text-outline">
                <th className="px-6 py-3">쇼핑몰</th>
                <th className="px-6 py-3 text-center">Basic</th>
                <th className="px-6 py-3 text-center">Premium</th>
                <th className="px-6 py-3 text-center">총 호출</th>
                <th className="px-6 py-3 text-right">추정 비용</th>
                <th className="hidden px-6 py-3 md:table-cell">마지막 사용</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.shopId}
                  className="border-b border-outline-variant/5 transition-colors hover:bg-surface-container-low/50"
                >
                  <td className="px-6 py-3 font-semibold text-on-surface">
                    {c.shopName}
                  </td>
                  <td className="px-6 py-3 text-center text-on-surface-variant">
                    {c.basicCount}
                  </td>
                  <td className="px-6 py-3 text-center text-on-surface-variant">
                    {c.premiumCount}
                  </td>
                  <td className="px-6 py-3 text-center font-semibold text-on-surface">
                    {c.totalCalls}
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-on-surface">
                    ₩{c.estimatedCost.toLocaleString()}
                  </td>
                  <td className="hidden px-6 py-3 text-on-surface-variant md:table-cell">
                    {formatDate(c.lastUsed)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-outline-variant/20 bg-surface-container/30">
                <td className="px-6 py-3 font-bold text-on-surface">합계</td>
                <td className="px-6 py-3 text-center font-semibold text-on-surface">
                  {customers.reduce((s, c) => s + c.basicCount, 0)}
                </td>
                <td className="px-6 py-3 text-center font-semibold text-on-surface">
                  {customers.reduce((s, c) => s + c.premiumCount, 0)}
                </td>
                <td className="px-6 py-3 text-center font-bold text-on-surface">
                  {customers.reduce((s, c) => s + c.totalCalls, 0)}
                </td>
                <td className="px-6 py-3 text-right font-bold text-[#006195]">
                  ₩{customers.reduce((s, c) => s + c.estimatedCost, 0).toLocaleString()}
                </td>
                <td className="hidden md:table-cell" />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
