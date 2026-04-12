"use server";

import { requireAdmin } from "@/features/admin/lib/require-admin";

// ============================================================
// 비용 추정 상수 (원)
// ============================================================

const COST_PER_CALL: Record<string, number> = {
  basic: 150,
  premium: 800,
};

const DEFAULT_COST = 150;

// ============================================================
// 타입
// ============================================================

export interface CostKpi {
  readonly totalCalls: number;
  readonly estimatedCost: number;
  readonly dailyAverage: number;
  readonly successRate: number;
}

export interface DailyStat {
  readonly date: string;
  readonly basic: number;
  readonly premium: number;
  readonly totalCost: number;
}

export interface CustomerCostRow {
  readonly shopId: string;
  readonly shopName: string;
  readonly basicCount: number;
  readonly premiumCount: number;
  readonly totalCalls: number;
  readonly estimatedCost: number;
  readonly lastUsed: string;
}

interface ActionResult<T> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

// ============================================================
// 헬퍼
// ============================================================

function getMonthStartUTC(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00.000Z`;
}

function get30DaysAgoUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 30);
  return d.toISOString();
}

function costForPlan(plan: string | null): number {
  if (!plan) return DEFAULT_COST;
  return COST_PER_CALL[plan] ?? DEFAULT_COST;
}

// ============================================================
// Server Actions
// ============================================================

/** 이번 달 KPI 집계 */
export async function getCostKpi(): Promise<ActionResult<CostKpi>> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  const monthStart = getMonthStartUTC();

  const { data, error } = await auth.ctx.supabase
    .from("optimizations")
    .select("plan, status")
    .gte("created_at", monthStart);

  if (error) {
    return { success: false, error: "KPI 데이터를 불러올 수 없습니다." };
  }

  const rows = (data ?? []) as readonly { plan: string | null; status: string }[];
  const totalCalls = rows.length;
  const successCount = rows.filter((r) => r.status === "completed").length;

  let estimatedCost = 0;
  for (const row of rows) {
    estimatedCost += costForPlan(row.plan);
  }

  const now = new Date();
  const dayOfMonth = now.getUTCDate();
  const dailyAverage = dayOfMonth > 0 ? Math.round(totalCalls / dayOfMonth) : 0;
  const successRate = totalCalls > 0 ? Math.round((successCount / totalCalls) * 100) : 0;

  return {
    success: true,
    data: { totalCalls, estimatedCost, dailyAverage, successRate },
  };
}

/** 최근 30일 일별 통계 */
export async function getDailyStats(): Promise<ActionResult<readonly DailyStat[]>> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  const since = get30DaysAgoUTC();

  const { data, error } = await auth.ctx.supabase
    .from("optimizations")
    .select("plan, created_at")
    .gte("created_at", since);

  if (error) {
    return { success: false, error: "일별 통계를 불러올 수 없습니다." };
  }

  // 일별 집계
  const byDate = new Map<string, { basic: number; premium: number }>();

  for (const row of (data ?? []) as readonly { plan: string | null; created_at: string }[]) {
    const date = row.created_at.slice(0, 10);
    const entry = byDate.get(date) ?? { basic: 0, premium: 0 };
    if (row.plan === "premium") {
      entry.premium += 1;
    } else {
      entry.basic += 1;
    }
    byDate.set(date, entry);
  }

  // 30일 전체 채우기 (빈 날짜도 0으로)
  const stats: DailyStat[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    const entry = byDate.get(date) ?? { basic: 0, premium: 0 };
    stats.push({
      date,
      basic: entry.basic,
      premium: entry.premium,
      totalCost:
        entry.basic * (COST_PER_CALL["basic"] ?? DEFAULT_COST) +
        entry.premium * (COST_PER_CALL["premium"] ?? DEFAULT_COST),
    });
  }

  return { success: true, data: stats };
}

/** 고객별 사용량 */
export async function getCustomerCosts(): Promise<ActionResult<readonly CustomerCostRow[]>> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  const monthStart = getMonthStartUTC();

  const { data, error } = await auth.ctx.supabase
    .from("optimizations")
    .select("plan, created_at, shops(id, name)")
    .gte("created_at", monthStart);

  if (error) {
    return { success: false, error: "고객별 비용을 불러올 수 없습니다." };
  }

  const byShop = new Map<
    string,
    { name: string; basic: number; premium: number; lastUsed: string }
  >();

  for (const row of data ?? []) {
    // Supabase FK join: many-to-one → 객체, one-to-many → 배열
    const shopRaw = row.shops;
    if (!shopRaw || Array.isArray(shopRaw)) continue;
    const shop = shopRaw as { id: string; name: string };

    const entry = byShop.get(shop.id) ?? {
      name: shop.name,
      basic: 0,
      premium: 0,
      lastUsed: row.created_at,
    };

    if (row.plan === "premium") {
      entry.premium += 1;
    } else {
      entry.basic += 1;
    }

    if (row.created_at > entry.lastUsed) {
      entry.lastUsed = row.created_at;
    }

    byShop.set(shop.id, entry);
  }

  const result: CustomerCostRow[] = [];
  for (const [shopId, entry] of byShop) {
    result.push({
      shopId,
      shopName: entry.name,
      basicCount: entry.basic,
      premiumCount: entry.premium,
      totalCalls: entry.basic + entry.premium,
      estimatedCost:
        entry.basic * (COST_PER_CALL["basic"] ?? DEFAULT_COST) +
        entry.premium * (COST_PER_CALL["premium"] ?? DEFAULT_COST),
      lastUsed: entry.lastUsed,
    });
  }

  // 비용 높은 순 정렬
  result.sort((a, b) => b.estimatedCost - a.estimatedCost);

  return { success: true, data: result };
}
