"use client";

import { useState, useCallback, type ReactElement } from "react";
import { Check, Code2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DeployProduct } from "../actions";

interface DeployJsonLdProps {
  readonly products: readonly DeployProduct[];
}

const COPIED_RESET_MS = 1500;

export function DeployJsonLd({ products }: DeployJsonLdProps): ReactElement {
  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <SectionHeader />
        <div className="rounded-2xl border-2 border-dashed border-[var(--outline-variant)] p-8 text-center">
          <p className="text-sm text-[var(--on-surface-variant)]">
            아직 완료된 최적화 결과가 없습니다. AI 최적화를 실행한 뒤 이곳에서
            코드를 복사할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader />
      <p className="text-sm text-[var(--on-surface-variant)]">
        아래 JSON-LD 코드를 쇼핑몰 상품 상세페이지의{" "}
        <code className="rounded bg-[var(--surface-container)] px-1.5 py-0.5 text-xs font-mono">
          {"<head>"}
        </code>{" "}
        태그 안에 붙여넣으세요.
      </p>
      <div className="space-y-3">
        {products.map((product) => (
          <ProductJsonLdCard key={product.optimizationId} product={product} />
        ))}
      </div>
    </div>
  );
}

function SectionHeader(): ReactElement {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--primary-fixed)]/40 text-[var(--primary)]">
        <Code2 className="size-5" />
      </div>
      <div>
        <h3
          className="text-lg font-bold tracking-tight text-[var(--on-surface)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          JSON-LD 코드 복사
        </h3>
        <p className="text-sm text-[var(--on-surface-variant)]">
          상품별 구조화 데이터를 쇼핑몰에 적용
        </p>
      </div>
    </div>
  );
}

function ProductJsonLdCard({
  product,
}: {
  readonly product: DeployProduct;
}): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const scriptTag = product.jsonld
    ? `<script type="application/ld+json">\n${JSON.stringify(product.jsonld, null, 2)}\n</script>`
    : "";

  const handleCopy = useCallback(async () => {
    if (!scriptTag) return;
    try {
      await navigator.clipboard.writeText(scriptTag);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), COPIED_RESET_MS);
    } catch {
      // clipboard API 실패 무시
    }
  }, [scriptTag]);

  if (!product.jsonld) return <></>;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--outline-variant)]/30 bg-[var(--surface-container-lowest)]">
      {/* 헤더 */}
      <div className="flex w-full items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--surface-container-low)]">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex flex-1 items-center gap-3 overflow-hidden text-left"
        >
          <span className="shrink-0 rounded-full bg-[var(--primary-fixed)]/40 px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--primary)]">
            {product.plan}
          </span>
          <span className="truncate text-sm font-semibold text-[var(--on-surface)]">
            {product.productName}
          </span>
          {product.score !== null && (
            <span className="shrink-0 text-xs text-[var(--on-surface-variant)]">
              {product.score}점
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="ml-auto size-4 shrink-0 text-[var(--on-surface-variant)]" />
          ) : (
            <ChevronDown className="ml-auto size-4 shrink-0 text-[var(--on-surface-variant)]" />
          )}
        </button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="shrink-0 gap-1.5 text-[var(--primary)]"
        >
          {copyState === "copied" ? (
            <>
              <Check className="size-3" />
              복사됨
            </>
          ) : (
            <>
              <Copy className="size-3" />
              복사
            </>
          )}
        </Button>
      </div>

      {/* 코드 블록 */}
      {isOpen && (
        <div className="border-t border-[var(--outline-variant)]/20 bg-[var(--surface-container)]">
          <pre className="max-h-[300px] overflow-auto p-4 text-xs leading-relaxed text-[var(--on-surface)]">
            {scriptTag}
          </pre>
        </div>
      )}
    </div>
  );
}
