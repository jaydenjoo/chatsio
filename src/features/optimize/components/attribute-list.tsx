"use client";

import { useState, useCallback, type ReactElement } from "react";
import { FileQuestion, Pencil, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================
// 편집 가능한 필드 목록 — 사용자가 수정할 수 있는 필드만 허용
// ============================================================

const EDITABLE_STRING_FIELDS = new Set([
  "optimized_title",
  "optimized_description",
  "product_type",
  "target_audience",
]);

const EDITABLE_STRING_ARRAY_FIELDS = new Set([
  "keywords",
]);

/** 편집 불가 필드 — 시스템 생성 값이라 사용자 수정 의미 없음 */
const READ_ONLY_FIELDS = new Set([
  "eeat_score",
  "optimization_score",
  "optimized_at",
]);

function isEditableField(key: string): boolean {
  return (
    EDITABLE_STRING_FIELDS.has(key) ||
    EDITABLE_STRING_ARRAY_FIELDS.has(key)
  );
}

// ============================================================
// Props
// ============================================================

interface AttributeListProps {
  readonly resultJson: Record<string, unknown> | null;
  readonly isEditing?: boolean;
  readonly editData?: Record<string, unknown>;
  readonly onEditChange?: (key: string, value: unknown) => void;
  readonly onSave?: () => void;
  readonly onCancel?: () => void;
  readonly onStartEdit?: () => void;
  readonly isSaving?: boolean;
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
  optimized_title: "최적화 제목",
  optimized_description: "최적화 설명",
  product_type: "상품 유형",
  target_audience: "타겟 고객",
  core_features: "핵심 특장점",
  key_benefits: "주요 혜택",
  use_cases: "활용 사례",
  faqs: "FAQ",
  related_queries: "관련 검색어",
  pros_cons: "장단점",
  comparison_data: "비교 데이터",
  buying_guide: "구매 가이드",
  eeat_score: "E-E-A-T 점수",
  optimization_score: "최적화 점수",
  optimized_at: "최적화 일시",
};

function formatLabel(key: string): string {
  return ATTRIBUTE_LABELS[key] ?? key;
}

// ============================================================
// AttributeList
// ============================================================

export function AttributeList({
  resultJson,
  isEditing = false,
  editData,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  isSaving = false,
}: AttributeListProps): ReactElement {
  if (resultJson === null || Object.keys(resultJson).length === 0) {
    return <EmptyState />;
  }

  const displayData = isEditing && editData ? editData : resultJson;
  const entries = Object.entries(displayData);

  return (
    <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h3
          className="text-lg font-bold tracking-tight text-[var(--on-surface)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          추출된 속성
        </h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--surface-container)] px-3 py-1 text-xs font-semibold text-[var(--on-surface-variant)]">
            {entries.length}개 속성
          </span>
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                disabled={isSaving}
                className="gap-1.5 text-[var(--on-surface-variant)]"
              >
                <X className="size-3.5" />
                취소
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="gap-1.5 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] shadow-md"
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </>
          ) : onStartEdit ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onStartEdit}
              className="gap-1.5 text-[var(--primary)]"
            >
              <Pencil className="size-3.5" />
              편집
            </Button>
          ) : null}
        </div>
      </div>
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <AttributeRow
            key={key}
            fieldKey={key}
            label={formatLabel(key)}
            value={value}
            isEditing={isEditing && isEditableField(key)}
            onEditChange={onEditChange}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// AttributeRow (읽기 + 편집 모드)
// ============================================================

interface AttributeRowProps {
  readonly fieldKey: string;
  readonly label: string;
  readonly value: unknown;
  readonly isEditing?: boolean;
  readonly onEditChange?: (key: string, value: unknown) => void;
}

function AttributeRow({
  fieldKey,
  label,
  value,
  isEditing = false,
  onEditChange,
}: AttributeRowProps): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl p-4 transition-colors hover:bg-[var(--surface-container-low)]">
      <div className="w-1/3 shrink-0 text-sm font-semibold text-[var(--on-surface-variant)]">
        {label}
        {isEditing && (
          <span className="ml-1.5 text-[10px] text-[var(--primary)]">편집 가능</span>
        )}
      </div>
      <div className="flex-1 text-sm text-[var(--on-surface)]">
        {isEditing ? (
          <EditableValue
            fieldKey={fieldKey}
            value={value}
            onEditChange={onEditChange}
          />
        ) : (
          <AttributeValue value={value} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// EditableValue — 필드 타입별 편집 UI
// ============================================================

function EditableValue({
  fieldKey,
  value,
  onEditChange,
}: {
  readonly fieldKey: string;
  readonly value: unknown;
  readonly onEditChange?: (key: string, value: unknown) => void;
}): ReactElement {
  const handleChange = useCallback(
    (newValue: unknown) => {
      onEditChange?.(fieldKey, newValue);
    },
    [fieldKey, onEditChange],
  );

  // string 필드
  if (EDITABLE_STRING_FIELDS.has(fieldKey) && typeof value === "string") {
    const isLong = fieldKey === "optimized_description";
    return isLong ? (
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        rows={6}
        className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-3 text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-3 py-2 text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
      />
    );
  }

  // string[] 필드 (keywords) — 태그 편집
  if (EDITABLE_STRING_ARRAY_FIELDS.has(fieldKey) && Array.isArray(value)) {
    return (
      <TagEditor
        tags={value as string[]}
        onChange={(tags) => handleChange(tags)}
      />
    );
  }

  // 기타 — 읽기 전용 fallback
  return <AttributeValue value={value} />;
}

// ============================================================
// TagEditor — 키워드 태그 편집
// ============================================================

function TagEditor({
  tags,
  onChange,
}: {
  readonly tags: readonly string[];
  readonly onChange: (tags: string[]) => void;
}): ReactElement {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputValue("");
    }
  }, [inputValue, tags, onChange]);

  const handleRemove = useCallback(
    (idx: number) => {
      onChange(tags.filter((_, i) => i !== idx));
    },
    [tags, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd],
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-fixed)]/40 px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)]"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-[var(--primary)]/20"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="키워드 입력 후 Enter"
          className="flex-1 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-3 py-1.5 text-xs text-[var(--on-surface)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleAdd}
          className="text-xs text-[var(--primary)]"
        >
          추가
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 읽기 전용 렌더러 (기존 코드)
// ============================================================

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
