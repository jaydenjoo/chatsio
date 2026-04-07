"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runOptimization } from "../actions";
import type { OptimizationProductCard } from "../actions";
import type { OptimizationPlan } from "../validation";
import { ProductPicker } from "./product-picker";
import { PlanPicker } from "./plan-picker";
import { DuplicateDialog } from "./duplicate-dialog";
import { LockedProductCard } from "./locked-product-card";

interface OptimizeFormProps {
  readonly products: readonly OptimizationProductCard[];
  readonly preselectedProductId: string | null;
}

interface DuplicateState {
  readonly open: boolean;
  readonly optimizationId: string | null;
}

export function OptimizeForm({
  products,
  preselectedProductId,
}: OptimizeFormProps): ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    preselectedProductId,
  );
  // preselected면 picker 숨김. "변경" 클릭 시 풀림
  const [pickerOverride, setPickerOverride] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<OptimizationPlan>("basic");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateState>({
    open: false,
    optimizationId: null,
  });

  const showLocked = preselectedProductId !== null && !pickerOverride;
  const lockedProduct =
    preselectedProductId !== null
      ? (products.find((p) => p.id === preselectedProductId) ?? null)
      : null;

  function handleSubmit(): void {
    if (!selectedProductId) {
      setSubmitError("최적화할 상품을 선택해주세요.");
      return;
    }
    setSubmitError(null);

    startTransition(async () => {
      const result = await runOptimization({
        productId: selectedProductId,
        plan: selectedPlan,
      });

      if (result.success && result.optimizationId) {
        router.push(`/optimize/${result.optimizationId}`);
        return;
      }

      if (
        result.errorCode === "DUPLICATE_IN_FLIGHT" &&
        result.duplicateOptimizationId
      ) {
        setDuplicate({
          open: true,
          optimizationId: result.duplicateOptimizationId,
        });
        return;
      }

      setSubmitError(
        result.error ?? "최적화 요청 중 오류가 발생했습니다.",
      );
    });
  }

  const isSubmitDisabled = !selectedProductId || isPending;

  return (
    <div className="space-y-8">
      {/* 1단계 — 상품 */}
      <section>
        <SectionHeader
          step={1}
          title="최적화할 상품"
          description="AI로 구조화할 상품 하나를 선택하세요."
        />

        {showLocked && lockedProduct ? (
          <LockedProductCard
            product={lockedProduct}
            onChangeClick={() => {
              setPickerOverride(true);
              setSelectedProductId(null);
            }}
          />
        ) : (
          <ProductPicker
            products={products}
            selectedProductId={selectedProductId}
            onSelect={setSelectedProductId}
          />
        )}
      </section>

      {/* 2단계 — Plan */}
      <section>
        <SectionHeader
          step={2}
          title="최적화 플랜"
          description="필요한 깊이와 예상 소요 시간을 확인하고 선택하세요."
        />
        <PlanPicker selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
      </section>

      {/* 에러 배너 */}
      {submitError && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--error)]/40 bg-[var(--error)]/5 p-4 text-sm text-[var(--error)]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{submitError}</p>
        </div>
      )}

      {/* 실행 버튼 */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="gap-2 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] shadow-lg hover:scale-[1.02] disabled:hover:scale-100 transition-transform"
          size="lg"
        >
          <Sparkles className="size-4" />
          {isPending ? "요청 전송 중..." : "최적화 실행"}
        </Button>
      </div>

      <DuplicateDialog
        open={duplicate.open}
        duplicateOptimizationId={duplicate.optimizationId}
        onDismiss={() => setDuplicate({ open: false, optimizationId: null })}
      />
    </div>
  );
}

interface SectionHeaderProps {
  readonly step: number;
  readonly title: string;
  readonly description: string;
}

function SectionHeader({
  step,
  title,
  description,
}: SectionHeaderProps): ReactElement {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-[var(--on-primary)]">
        {step}
      </div>
      <div>
        <h2 className="text-base font-bold tracking-tight text-[var(--on-surface)]">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-[var(--on-surface-variant)]">
          {description}
        </p>
      </div>
    </div>
  );
}
