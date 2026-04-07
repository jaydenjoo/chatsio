import type { ReactElement } from "react";
import { Package, Lock, RefreshCw } from "lucide-react";
import type { OptimizationProductCard } from "../actions";

interface LockedProductCardProps {
  readonly product: OptimizationProductCard;
  readonly onChangeClick?: () => void;
}

export function LockedProductCard({
  product,
  onChangeClick,
}: LockedProductCardProps): ReactElement {
  const thumbnail = product.imageUrls?.[0];

  return (
    <div className="flex items-center gap-4 rounded-2xl border-2 border-[var(--primary)] bg-[var(--primary-fixed)]/40 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.08)]">
      {/* 썸네일 */}
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-container-high)]">
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
            <Package className="size-6 text-[var(--outline)]" />
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Lock className="size-3.5 text-[var(--primary)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
            선택된 상품
          </span>
        </div>
        <p className="mt-1 truncate text-base font-bold text-[var(--on-surface)]">
          {product.name}
        </p>
        {product.url && (
          <p className="mt-0.5 truncate text-xs text-[var(--on-surface-variant)]">
            {product.url}
          </p>
        )}
      </div>

      {/* 변경 버튼 */}
      {onChangeClick && (
        <button
          type="button"
          onClick={onChangeClick}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 py-2 text-xs font-bold text-[var(--on-surface)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          <RefreshCw className="size-3.5" />
          변경
        </button>
      )}
    </div>
  );
}
