"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link as LinkIcon, Image as ImageIcon, FileText, Search, Sparkles, Bolt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct } from "@/features/products";
import type { CreateProductInput } from "@/features/products";

type TabKey = "url" | "image" | "csv";

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
}

const TABS: TabDef[] = [
  { key: "url", label: "URL 입력", icon: <LinkIcon className="size-4" />, disabled: false },
  { key: "image", label: "이미지 업로드", icon: <ImageIcon className="size-4" />, disabled: true },
  { key: "csv", label: "CSV 일괄 등록", icon: <FileText className="size-4" />, disabled: true },
];

export function ProductCreateForm(): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabKey>("url");
  const [form, setForm] = useState<CreateProductInput>({ name: "", url: "" });
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof CreateProductInput>(
    key: K,
    value: CreateProductInput[K],
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset(): void {
    setForm({ name: "", url: "" });
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createProduct(form);
      if (!result.success) {
        setError(result.error ?? "알 수 없는 오류가 발생했습니다.");
        return;
      }
      router.push("/products");
    });
  }

  return (
    <div className="space-y-8">
      {/* 메인 등록 카드 — Shadow Level 3 */}
      <div
        className="rounded-[20px] bg-[var(--surface-container-lowest)] p-6 sm:p-8"
        style={{
          boxShadow:
            "0 10px 30px -5px rgba(0, 97, 149, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Segmented Control */}
        <div
          role="tablist"
          aria-label="상품 등록 방식"
          className="mb-8 flex gap-1 rounded-xl bg-[var(--surface-container)] p-1"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={tab.disabled}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[var(--surface-container-lowest)] text-[var(--primary)] shadow-sm"
                    : tab.disabled
                      ? "cursor-not-allowed text-[var(--outline)]/60"
                      : "text-[var(--outline)] hover:text-[var(--on-surface)]"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.disabled && (
                  <span className="ml-1 rounded-full bg-[var(--surface-container-highest)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-variant)]">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* URL 입력 탭 */}
        {activeTab === "url" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 상품명 */}
            <div className="space-y-2">
              <Label
                htmlFor="product-name"
                className="flex items-center gap-2 text-sm font-bold text-[var(--on-surface)]"
              >
                <Sparkles className="size-4 text-[var(--primary)]" />
                상품명
              </Label>
              <Input
                id="product-name"
                placeholder="예: 오버핏 코튼 반팔 티셔츠"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                maxLength={200}
                required
                disabled={isPending}
                className="h-12 rounded-xl border-none bg-[var(--surface-container-highest)] px-4 text-[var(--on-surface)] placeholder:text-[var(--outline)]/60 focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20"
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label
                htmlFor="product-url"
                className="flex items-center gap-2 text-sm font-bold text-[var(--on-surface)]"
              >
                <LinkIcon className="size-4 text-[var(--primary)]" />
                상품 페이지 URL
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <Search className="size-4 text-[var(--outline)]" />
                </div>
                <Input
                  id="product-url"
                  type="url"
                  placeholder="https://mystore.cafe24.com/product/123"
                  value={form.url}
                  onChange={(e) => updateField("url", e.target.value)}
                  required
                  disabled={isPending}
                  className="h-12 rounded-xl border-none bg-[var(--surface-container-highest)] pl-11 pr-4 text-[var(--on-surface)] placeholder:text-[var(--outline)]/60 focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20"
                />
              </div>
              <p className="text-xs text-[var(--on-surface-variant)]">
                상품 상세 페이지 URL을 붙여넣으세요. AI가 이미지와 설명을 자동으로 수집합니다.
              </p>
            </div>

            {/* 에러 */}
            {error && (
              <div className="rounded-xl bg-[var(--error-container)] px-4 py-3">
                <p className="text-sm font-medium text-[var(--on-error-container)]">
                  {error}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                disabled={isPending}
                className="px-6 font-bold text-[var(--outline)] hover:text-[var(--on-surface)]"
              >
                다시 입력
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] px-8 py-6 font-extrabold text-[var(--on-primary)] shadow-md transition-transform hover:scale-[1.02]"
              >
                {isPending ? "등록 중..." : "등록하기"}
              </Button>
            </div>
          </form>
        )}

        {/* 비활성 탭 안내 */}
        {activeTab !== "url" && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[var(--surface-container)]">
              {TABS.find((t) => t.key === activeTab)?.icon}
            </div>
            <h3 className="text-lg font-bold text-[var(--on-surface)]">준비 중입니다</h3>
            <p className="max-w-sm text-sm text-[var(--on-surface-variant)]">
              {activeTab === "image"
                ? "이미지 업로드 기능은 곧 제공됩니다. 지금은 URL 입력으로 등록해주세요."
                : "CSV 일괄 등록 기능은 곧 제공됩니다. 지금은 URL 입력으로 등록해주세요."}
            </p>
          </div>
        )}
      </div>

      {/* Bento 정보 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-2xl bg-[var(--surface-container-low)] p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--secondary-container)]">
            <Bolt className="size-5 text-[var(--on-secondary-container)]" />
          </div>
          <h4 className="font-bold text-[var(--on-surface)]">빠른 대량 등록</h4>
          <p className="text-sm leading-relaxed text-[var(--on-surface-variant)]">
            CSV 파일을 업로드하여 수백 개의 상품을 한 번에 시스템에 연동할 수 있습니다.
          </p>
        </div>
        <div className="space-y-3 rounded-2xl bg-[var(--surface-container-low)] p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--primary-container)]/20">
            <Sparkles className="size-5 text-[var(--primary)]" />
          </div>
          <h4 className="font-bold text-[var(--on-surface)]">AI 자동 태깅</h4>
          <p className="text-sm leading-relaxed text-[var(--on-surface-variant)]">
            URL 입력 시 상품 이미지를 분석하여 자동으로 카테고리와 키워드를 추출합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
