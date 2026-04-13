import { Search, CheckCircle, XCircle } from "lucide-react";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/shared";
import {
  getMyCitationSummary,
  type CitationProductSummary,
} from "@/features/citations/actions";

export const dynamic = "force-dynamic";

// ============================================================
// 스코어 색상
// ============================================================

function scoreColor(score: number | null): string {
  if (score === null) return "text-[var(--outline)]";
  if (score >= 60) return "text-[var(--success)]";
  if (score > 0) return "text-[var(--warning)]";
  return "text-[var(--outline)]";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// Before/After 카드
// ============================================================

function BeforeAfterCard({
  products,
}: {
  readonly products: readonly CitationProductSummary[];
}): ReactElement {
  const optimized = products.filter((p) => p.hasJsonLd);
  const tracked = products.filter((p) => p.citationScore !== null);
  const avgOptScore =
    optimized.length > 0
      ? Math.round(
          optimized.reduce((s, p) => s + (p.optimizationScore ?? 0), 0) /
            optimized.length,
        )
      : null;
  const avgCitScore =
    tracked.length > 0
      ? Math.round(
          tracked.reduce((s, p) => s + (p.citationScore ?? 0), 0) /
            tracked.length,
        )
      : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Before */}
      <div className="rounded-2xl border-2 border-dashed border-[var(--outline-variant)]/30 bg-[var(--surface-container-low)] p-6">
        <div className="mb-4 inline-block rounded-full bg-[var(--outline)]/10 px-3 py-1 text-xs font-semibold text-[var(--outline)]">
          Before
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-[var(--on-surface-variant)]">구조화 데이터</div>
            <div className="font-display text-2xl font-extrabold text-[var(--outline)]">없음</div>
          </div>
          <div>
            <div className="text-xs text-[var(--on-surface-variant)]">AI 검색 인용</div>
            <div className="font-display text-2xl font-extrabold text-[var(--outline)]">추적 불가</div>
          </div>
          <div>
            <div className="text-xs text-[var(--on-surface-variant)]">네이버/구글 노출</div>
            <div className="font-display text-2xl font-extrabold text-[var(--outline)]">기본값</div>
          </div>
        </div>
      </div>

      {/* After */}
      <div className="rounded-2xl border-2 border-[var(--primary)]/20 bg-[var(--surface-container-lowest)] p-6 shadow-[var(--shadow-sm)]">
        <div className="mb-4 inline-block rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          After — Chatsio 적용
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-[var(--on-surface-variant)]">구조화 데이터</div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-[var(--primary)]">
                {optimized.length > 0 ? `${optimized.length}개 적용` : "대기 중"}
              </span>
              {avgOptScore !== null && (
                <span className="text-sm text-[var(--on-surface-variant)]">
                  평균 {avgOptScore}점
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--on-surface-variant)]">AI 검색 인용</div>
            <div className="flex items-baseline gap-2">
              <span className={`font-display text-2xl font-extrabold ${scoreColor(avgCitScore)}`}>
                {avgCitScore !== null ? `${avgCitScore}점` : "추적 대기"}
              </span>
              {tracked.length > 0 && (
                <span className="text-sm text-[var(--on-surface-variant)]">
                  {tracked.length}개 상품 추적
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--on-surface-variant)]">네이버/구글 노출</div>
            <div className="font-display text-2xl font-extrabold text-[var(--success)]">
              {optimized.length > 0 ? "Rich Results 활성" : "대기 중"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 페이지
// ============================================================

export default async function CitationsPage(): Promise<ReactElement> {
  const result = await getMyCitationSummary();
  const products = result.data ?? [];
  const tracked = products.filter((p) => p.citationScore !== null);

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI 인용 리포트"
        description="AI 검색엔진(ChatGPT)에서 내 상품이 추천되는지 확인합니다."
      />

      {/* 에러 */}
      {!result.success && (
        <div className="rounded-xl bg-[var(--error-container)]/30 px-5 py-3 text-sm text-[var(--on-error-container)]">
          {result.error}
        </div>
      )}

      {/* Before/After */}
      {products.length > 0 && <BeforeAfterCard products={products} />}

      {/* 상품별 인용 현황 */}
      {result.success && products.length > 0 ? (
        <div className="rounded-2xl bg-[var(--surface-container-lowest)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--outline-variant)]/10 px-6 py-4">
            <h3 className="font-display text-lg font-bold text-[var(--on-surface)]">
              상품별 인용 현황
            </h3>
            <p className="mt-0.5 text-xs text-[var(--on-surface-variant)]">
              {tracked.length > 0
                ? `${tracked.length}개 상품 추적 완료`
                : "아직 인용 추적 결과가 없습니다. 관리자에게 문의하세요."}
            </p>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--outline-variant)]/10 text-xs font-bold uppercase tracking-wider text-[var(--outline)]">
                <th className="px-6 py-3">상품명</th>
                <th className="px-6 py-3 text-center">최적화 점수</th>
                <th className="px-6 py-3 text-center">인용 여부</th>
                <th className="px-6 py-3 text-right">Citation Score</th>
                <th className="hidden px-6 py-3 md:table-cell">마지막 추적</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.productId}
                  className="border-b border-[var(--outline-variant)]/5 transition-colors hover:bg-[var(--surface-container-low)]/50"
                >
                  <td className="max-w-[250px] truncate px-6 py-3 font-semibold text-[var(--on-surface)]">
                    {p.productName}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {p.optimizationScore !== null ? (
                      <span className="font-semibold text-[var(--on-surface)]">
                        {p.optimizationScore}
                      </span>
                    ) : (
                      <span className="text-[var(--outline)]">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {p.totalCount > 0 ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.citedCount > 0
                            ? "bg-[var(--success)]/10 text-[var(--success)]"
                            : "bg-[var(--outline)]/10 text-[var(--outline)]"
                        }`}
                      >
                        {p.citedCount > 0 ? (
                          <><CheckCircle className="h-3 w-3" /> {p.citedCount}/{p.totalCount}</>
                        ) : (
                          <><XCircle className="h-3 w-3" /> 0/{p.totalCount}</>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--outline)]">추적 대기</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {p.citationScore !== null ? (
                      <span
                        className={`font-display text-lg font-extrabold ${scoreColor(p.citationScore)}`}
                      >
                        {p.citationScore}
                      </span>
                    ) : (
                      <span className="text-[var(--outline)]">—</span>
                    )}
                  </td>
                  <td className="hidden px-6 py-3 text-[var(--on-surface-variant)] md:table-cell">
                    {p.lastTrackedAt ? formatDate(p.lastTrackedAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : result.success && products.length === 0 ? (
        <div className="rounded-2xl bg-[var(--surface-container-lowest)] px-6 py-12 text-center shadow-[var(--shadow-sm)]">
          <Search className="mx-auto h-10 w-10 text-[var(--outline)]/40" />
          <h3 className="mt-3 font-display text-lg font-bold text-[var(--on-surface)]">
            등록된 상품이 없습니다
          </h3>
          <p className="mt-1 text-sm text-[var(--on-surface-variant)]">
            상품을 등록하고 AI 최적화를 실행하면 인용 추적 결과를 확인할 수 있습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
