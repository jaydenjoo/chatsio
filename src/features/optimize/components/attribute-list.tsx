"use client";

import type { ReactElement } from "react";
import { FileQuestion } from "lucide-react";

interface AttributeListProps {
  readonly resultJson: Record<string, unknown> | null;
}

// 알려진 필드의 한글 라벨. 매칭 안 되면 원본 키를 그대로 표시.
const ATTRIBUTE_LABELS: Record<string, string> = {
  name: "상품명",
  title: "제목",
  brand: "브랜드",
  category: "카테고리",
  categories: "카테고리",
  material: "소재",
  materials: "소재",
  color: "색상",
  colors: "색상",
  size: "사이즈",
  sizes: "사이즈",
  fit: "핏",
  style: "스타일",
  features: "특장점",
  feature: "특장점",
  description: "설명",
  summary: "요약",
  highlights: "핵심 포인트",
  price: "가격",
  currency: "통화",
  sku: "SKU",
  gtin: "GTIN",
  model: "모델명",
  manufacturer: "제조사",
  origin: "원산지",
  gender: "성별",
  age_group: "연령대",
  ageGroup: "연령대",
  season: "시즌",
  care: "관리 방법",
  care_instructions: "관리 방법",
  careInstructions: "관리 방법",
  keywords: "키워드",
  tags: "태그",
};

function formatLabel(key: string): string {
  return ATTRIBUTE_LABELS[key] ?? key;
}

export function AttributeList({ resultJson }: AttributeListProps): ReactElement {
  if (resultJson === null || Object.keys(resultJson).length === 0) {
    return <EmptyState />;
  }

  const entries = Object.entries(resultJson);

  return (
    <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h3
          className="text-lg font-bold tracking-tight text-[var(--on-surface)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          추출된 속성
        </h3>
        <span className="rounded-full bg-[var(--surface-container)] px-3 py-1 text-xs font-semibold text-[var(--on-surface-variant)]">
          {entries.length}개 속성
        </span>
      </div>
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <AttributeRow key={key} label={formatLabel(key)} value={value} />
        ))}
      </div>
    </div>
  );
}

interface AttributeRowProps {
  readonly label: string;
  readonly value: unknown;
}

function AttributeRow({ label, value }: AttributeRowProps): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl p-4 transition-colors hover:bg-[var(--surface-container-low)]">
      <div className="w-1/3 shrink-0 text-sm font-semibold text-[var(--on-surface-variant)]">
        {label}
      </div>
      <div className="flex-1 text-sm text-[var(--on-surface)]">
        <AttributeValue value={value} />
      </div>
    </div>
  );
}

function AttributeValue({ value }: { readonly value: unknown }): ReactElement {
  if (value === null || value === undefined) {
    return <span className="text-[var(--outline)]">값 없음</span>;
  }

  if (typeof value === "string") {
    if (value.length === 0) {
      return <span className="text-[var(--outline)]">빈 문자열</span>;
    }
    return <span className="font-semibold">{value}</span>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="font-semibold">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-[var(--outline)]">빈 배열</span>;
    }
    return <ArrayPreview items={value} />;
  }

  if (typeof value === "object") {
    return <ObjectPreview value={value as Record<string, unknown>} />;
  }

  return <span className="font-mono text-xs">{String(value)}</span>;
}

function ArrayPreview({ items }: { readonly items: readonly unknown[] }): ReactElement {
  const preview = items.slice(0, 5);
  const remaining = items.length - preview.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {preview.map((item, idx) => (
        <span
          key={idx}
          className="inline-flex items-center rounded-full bg-[var(--primary-fixed)]/40 px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)]"
        >
          {formatPrimitive(item)}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-[var(--on-surface-variant)]">
          외 {remaining}개
        </span>
      )}
    </div>
  );
}

function ObjectPreview({
  value,
}: {
  readonly value: Record<string, unknown>;
}): ReactElement {
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return <span className="text-[var(--outline)]">빈 객체</span>;
  }

  return (
    <div className="space-y-1 rounded-xl bg-[var(--surface-container-low)] p-3">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2 text-xs">
          <span className="font-mono text-[var(--on-surface-variant)]">
            {k}:
          </span>
          <span className="font-mono text-[var(--on-surface)]">
            {formatPrimitive(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.length}]`;
  if (typeof value === "object") return "{…}";
  return String(value);
}

function EmptyState(): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-[var(--surface-container-lowest)] p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--surface-container)] text-[var(--outline)]">
        <FileQuestion className="size-6" />
      </div>
      <p className="text-base font-bold text-[var(--on-surface)]">
        속성 데이터가 없습니다
      </p>
      <p className="max-w-sm text-sm text-[var(--on-surface-variant)]">
        AI가 상품에서 구조화된 속성을 추출하지 못했습니다. 다시 시도하거나
        관리자에게 문의해주세요.
      </p>
    </div>
  );
}
