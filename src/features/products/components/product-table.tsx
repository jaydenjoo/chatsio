"use client";

import type { ReactElement } from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, MoreHorizontal, Zap, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/features/products";
import type { ProductRow } from "@/features/products";

interface ProductTableProps {
  readonly products: ProductRow[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

import type { BadgeStatus } from "@/types/components";

const STATUS_MAP: Record<string, { label: string; badgeStatus: BadgeStatus }> = {
  pending: { label: "대기중", badgeStatus: "pending" },
  optimized: { label: "완료", badgeStatus: "success" },
  failed: { label: "실패", badgeStatus: "error" },
  manual_review: { label: "수동확인", badgeStatus: "warning" },
};

export function ProductTable({
  products,
  total,
  page,
  limit,
}: ProductTableProps): ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit);

  function handlePageChange(newPage: number): void {
    const params = new URLSearchParams(window.location.search);
    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    router.push(`/products?${params.toString()}`);
  }

  function handleDelete(productId: string): void {
    setDeletingId(productId);
    startTransition(async () => {
      const result = await deleteProduct(productId);
      setDeletingId(null);
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div>
      {/* 테이블 */}
      <div className="bg-[var(--surface-container-lowest)] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
        <table className="w-full text-left">
          <thead className="bg-[var(--surface-container-low)]">
            <tr>
              <th className="py-4 px-6 font-bold text-[var(--on-surface-variant)] text-xs uppercase tracking-wider">
                상품
              </th>
              <th className="py-4 px-4 font-bold text-[var(--on-surface-variant)] text-xs uppercase tracking-wider hidden md:table-cell">
                URL
              </th>
              <th className="py-4 px-4 font-bold text-[var(--on-surface-variant)] text-xs uppercase tracking-wider">
                상태
              </th>
              <th className="py-4 px-4 font-bold text-[var(--on-surface-variant)] text-xs uppercase tracking-wider hidden lg:table-cell">
                등록일
              </th>
              <th className="py-4 px-4 font-bold text-[var(--on-surface-variant)] text-xs uppercase tracking-wider text-right">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-variant)]">
            {products.map((product) => (
              <tr
                key={product.id}
                className="group hover:bg-[var(--primary-fixed)]/20 transition-colors"
              >
                {/* 상품명 */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--surface-container-high)] flex items-center justify-center shrink-0">
                      <Package className="size-4 text-[var(--outline)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--on-surface)] truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-[var(--on-surface-variant)] truncate md:hidden">
                        {product.url ?? "URL 없음"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* URL */}
                <td className="py-4 px-4 hidden md:table-cell">
                  <p className="text-xs text-[var(--on-surface-variant)] truncate max-w-[200px]">
                    {product.url ?? "-"}
                  </p>
                </td>

                {/* 상태 */}
                <td className="py-4 px-4">
                  <StatusBadge
                    status={STATUS_MAP[product.status]?.badgeStatus ?? "pending"}
                    label={STATUS_MAP[product.status]?.label ?? product.status}
                  />
                </td>

                {/* 등록일 */}
                <td className="py-4 px-4 hidden lg:table-cell">
                  <p className="text-xs text-[var(--on-surface-variant)] font-medium">
                    {formatDate(product.created_at)}
                  </p>
                </td>

                {/* 액션 */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/optimize?productId=${product.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary-fixed)]/30"
                      >
                        <Zap className="size-3.5 mr-1" />
                        최적화
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-[var(--outline)] hover:text-[var(--error)]"
                      onClick={() => handleDelete(product.id)}
                      disabled={isPending && deletingId === product.id}
                      aria-label="상품 삭제"
                    >
                      {isPending && deletingId === product.id ? (
                        <MoreHorizontal className="size-4 animate-pulse" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-[var(--on-surface-variant)]">
            총 {total}개 중 {(page - 1) * limit + 1}-{Math.min(page * limit, total)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              이전
            </Button>
            <span className="text-sm font-medium text-[var(--on-surface)]">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
