import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";

interface KpiData {
  totalShops: number;
  totalOptimizations: number;
  weekOptimizations: number;
  successRate: number;
  recentErrors: number;
}

async function fetchKpiData(): Promise<KpiData> {
  const supabase = await createClient();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString();

  const [shopsRes, optAllRes, optWeekRes, optCompletedRes, errorsRes] =
    await Promise.all([
      supabase
        .from("shops")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("optimizations")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("optimizations")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgoIso),
      supabase
        .from("optimizations")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase
        .from("pipeline_events")
        .select("id", { count: "exact", head: true })
        .eq("level", "error")
        .gte("created_at", weekAgoIso),
    ]);

  const totalShops = shopsRes.count ?? 0;
  const totalOptimizations = optAllRes.count ?? 0;
  const weekOptimizations = optWeekRes.count ?? 0;
  const completedCount = optCompletedRes.count ?? 0;
  const recentErrors = errorsRes.count ?? 0;

  const successRate =
    totalOptimizations > 0
      ? Math.round((completedCount / totalOptimizations) * 100)
      : 0;

  return {
    totalShops,
    totalOptimizations,
    weekOptimizations,
    successRate,
    recentErrors,
  };
}

function KpiCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  sub,
}: {
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  sub?: string;
}): ReactElement {
  return (
    <div className="flex items-center gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-[var(--shadow-sm)]">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
      >
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <p className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
          {value}
        </p>
        <p className="text-sm text-on-surface-variant">{label}</p>
        {sub ? (
          <p className="mt-0.5 text-xs text-outline">{sub}</p>
        ) : null}
      </div>
    </div>
  );
}

export default async function AdminHomePage(): Promise<ReactElement> {
  const kpi = await fetchKpiData();

  const systemOk = kpi.recentErrors === 0;

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* 헤더 */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-on-surface">
          어드민 대시보드
        </h1>
        <p className="mt-2 text-on-surface-variant">
          서비스 현황을 한눈에 확인합니다.
        </p>
      </div>

      {/* KPI 카드 그리드 */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Users}
          iconBg="bg-[#006195]/10"
          iconColor="text-[#006195]"
          value={String(kpi.totalShops)}
          label="총 고객"
          sub="등록된 쇼핑몰"
        />
        <KpiCard
          icon={Activity}
          iconBg="bg-secondary/10"
          iconColor="text-secondary"
          value={String(kpi.totalOptimizations)}
          label="총 최적화"
          sub={`이번 주 ${kpi.weekOptimizations}건`}
        />
        <KpiCard
          icon={TrendingUp}
          iconBg="bg-[#006195]/10"
          iconColor="text-[#006195]"
          value={`${kpi.successRate}%`}
          label="성공률"
          sub="completed / total"
        />
        <KpiCard
          icon={systemOk ? CheckCircle : AlertTriangle}
          iconBg={systemOk ? "bg-secondary/10" : "bg-error/10"}
          iconColor={systemOk ? "text-secondary" : "text-error"}
          value={systemOk ? "정상" : `경고 ${kpi.recentErrors}건`}
          label="시스템 상태"
          sub="최근 7일 에러 기준"
        />
      </div>

      {/* 최근 활동 요약 — 추후 Task 4-5에서 차트로 교체 */}
      <div className="mt-8 grid gap-6 md:grid-cols-12">
        <div className="rounded-[24px] bg-surface-container-lowest p-8 shadow-[var(--shadow-sm)] md:col-span-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">최적화 현황</h2>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                <span className="text-xs font-bold uppercase tracking-widest text-secondary">
                  Live
                </span>
              </div>
            </div>
          </div>
          {/* 플레이스홀더 바 차트 */}
          <div className="flex h-48 items-end gap-2 px-4">
            {[40, 65, 55, 85, 45, 70, 60].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-xl bg-primary-fixed-dim/20 transition-all hover:bg-[#006195]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-6 flex justify-around">
            <div className="text-center">
              <p className="font-display text-2xl font-extrabold text-[#006195]">
                +{kpi.weekOptimizations}
              </p>
              <p className="text-xs text-on-surface-variant">이번 주</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-extrabold text-secondary">
                {kpi.successRate}%
              </p>
              <p className="text-xs text-on-surface-variant">성공률</p>
            </div>
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className="rounded-[24px] bg-surface-container-lowest p-8 shadow-[var(--shadow-sm)] md:col-span-4">
          <h2 className="mb-4 text-lg font-bold">빠른 액세스</h2>
          <div className="space-y-3">
            {[
              { label: "고객 관리", href: "/admin/customers" },
              { label: "최적화 로그", href: "/admin/optimizations" },
              { label: "프롬프트 편집", href: "/admin/prompts" },
              { label: "이벤트 로그", href: "/admin/events" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-[#006195]"
              >
                {link.label}
                <span className="text-outline">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
