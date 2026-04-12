import { Search, Users } from "lucide-react";
import type { ReactElement } from "react";
import { CSVExport, StatusBadge } from "@/components/shared";
import { createClient } from "@/lib/supabase/server";

const INDUSTRY_LABEL: Record<string, string> = {
  clothing: "의류",
  food: "식품",
  furniture: "가구",
  other: "기타",
};

const PLATFORM_LABEL: Record<string, string> = {
  cafe24: "Cafe24",
  imweb: "아임웹",
  godomall: "고도몰",
  other: "기타",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface CustomerRow {
  id: string;
  name: string;
  url: string;
  platform: string;
  industry: string;
  created_at: string;
  user_profiles: { full_name: string | null } | null;
  products: { count: number }[];
  optimizations: { count: number }[];
}

export default async function AdminCustomersPage(props: {
  searchParams: Promise<{ q?: string }>;
}): Promise<ReactElement> {
  const { q } = await props.searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("shops")
    .select(
      "id, name, url, platform, industry, created_at, user_profiles(full_name), products(count), optimizations(count)",
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: shops, error } = await query;

  if (error) {
    console.error("[AdminCustomers] query failed:", error.message);
  }

  const rows = (shops ?? []) as unknown as CustomerRow[];

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
            고객 관리
          </h1>
          <p className="mt-1 text-on-surface-variant">
            등록된 쇼핑몰과 고객 정보를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CSVExport
            filename="고객목록"
            headers={["쇼핑몰", "URL", "업종", "플랫폼", "상품수", "최적화수", "가입일"]}
            rows={rows.map((s) => [
              s.name,
              s.url,
              INDUSTRY_LABEL[s.industry] ?? s.industry,
              PLATFORM_LABEL[s.platform] ?? s.platform,
              String(s.products?.[0]?.count ?? 0),
              String(s.optimizations?.[0]?.count ?? 0),
              formatDate(s.created_at),
            ])}
          />
          <span className="rounded-full bg-[#006195]/10 px-3 py-1 text-sm font-bold text-[#006195]">
            {rows.length}개 쇼핑몰
          </span>
        </div>
      </div>

      {/* 검색 */}
      <form method="get" className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
          <input
            name="q"
            type="text"
            defaultValue={q ?? ""}
            placeholder="쇼핑몰명 검색..."
            className="w-full rounded-xl bg-surface-container-lowest py-3 pl-10 pr-4 text-sm shadow-[var(--shadow-sm)] outline-none placeholder:text-outline focus:ring-2 focus:ring-[#006195]/30"
          />
        </div>
      </form>

      {/* 테이블 */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-lowest py-16 text-center">
          <Users className="mb-4 h-10 w-10 text-outline" />
          <h3 className="text-lg font-bold text-on-surface">
            {q ? "검색 결과가 없습니다" : "등록된 고객이 없습니다"}
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {q
              ? `"${q}" 검색어와 일치하는 쇼핑몰이 없습니다.`
              : "첫 번째 고객이 가입하면 여기에 표시됩니다."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[var(--shadow-sm)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 text-xs font-bold uppercase tracking-wider text-outline">
                <th className="px-6 py-4">쇼핑몰</th>
                <th className="hidden px-6 py-4 md:table-cell">업종</th>
                <th className="hidden px-6 py-4 lg:table-cell">플랫폼</th>
                <th className="px-6 py-4 text-center">상품</th>
                <th className="px-6 py-4 text-center">최적화</th>
                <th className="hidden px-6 py-4 md:table-cell">가입일</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((shop) => {
                const productCount = shop.products?.[0]?.count ?? 0;
                const optCount = shop.optimizations?.[0]?.count ?? 0;
                return (
                  <tr
                    key={shop.id}
                    className="border-b border-outline-variant/5 transition-colors hover:bg-surface-container-low/50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-on-surface">
                          {shop.name}
                        </p>
                        <p className="mt-0.5 text-xs text-outline truncate max-w-[200px]">
                          {shop.url}
                        </p>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <StatusBadge
                        status="info"
                        label={INDUSTRY_LABEL[shop.industry] ?? shop.industry}
                        size="sm"
                      />
                    </td>
                    <td className="hidden px-6 py-4 text-on-surface-variant lg:table-cell">
                      {PLATFORM_LABEL[shop.platform] ?? shop.platform}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-on-surface">
                      {productCount}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-on-surface">
                      {optCount}
                    </td>
                    <td className="hidden px-6 py-4 text-on-surface-variant md:table-cell">
                      {formatDate(shop.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
