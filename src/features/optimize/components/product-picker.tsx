"use client";

import { useMemo, useState, type ReactElement } from "react";
import { Package, Search } from "lucide-react";
import type { OptimizationProductCard } from "../actions";

interface ProductPickerProps {
  readonly products: readonly OptimizationProductCard[];
  readonly selectedProductId: string | null;
  readonly onSelect: (productId: string) => void;
}

export function ProductPicker({
  products,
  selectedProductId,
  onSelect,
}: ProductPickerProps): ReactElement {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed === "") return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(trimmed) ||
        (p.url?.toLowerCase().includes(trimmed) ?? false),
    );
  }, [products, query]);

  return (
    <div className="space-y-4">
      {/* 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--on-surface-variant)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="상품명 또는 URL로 검색"
          aria-label="상품 검색"
          className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] py-3 pl-10 pr-4 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
        />
      </div>

      {/* 카드 리스트 (세로 스크롤) */}
      <div
        role="radiogroup"
        aria-label="최적화할 상품 선택"
        className="grid max-h-[400px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2"
      >
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-[var(--outline-variant)] p-8 text-center text-sm text-[var(--on-surface-variant)]">
            일치하는 상품이 없습니다
          </div>
        ) : (
          filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              selected={product.id === selectedProductId}
              onClick={() => onSelect(product.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ProductCardProps {
  readonly product: OptimizationProductCard;
  readonly selected: boolean;
  readonly onClick: () => void;
}

function ProductCard({
  product,
  selected,
  onClick,
}: ProductCardProps): ReactElement {
  const thumbnail = product.imageUrls?.[0];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
        selected
          ? "border-[var(--primary)] bg-[var(--primary-fixed)]/40 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.08)]"
          : "border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface-container-low)] hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]"
      }`}
    >
      {/* 썸네일 */}
      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-container-high)]">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-5 text-[var(--outline)]" />
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-bold ${
            selected ? "text-[var(--primary)]" : "text-[var(--on-surface)]"
          }`}
        >
          {product.name}
        </p>
        {product.url && (
          <p className="mt-1 truncate text-xs text-[var(--on-surface-variant)]">
            {product.url}
          </p>
        )}
      </div>

      {/* 선택 인디케이터 */}
      <div
        className={`mt-1 size-4 shrink-0 rounded-full border-2 transition-all ${
          selected
            ? "border-[var(--primary)] bg-[var(--primary)]"
            : "border-[var(--outline)] group-hover:border-[var(--primary)]/60"
        }`}
        aria-hidden="true"
      >
        {selected && (
          <div className="size-full rounded-full bg-[var(--on-primary)] scale-[0.35]" />
        )}
      </div>
    </button>
  );
}
