"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createShop } from "../actions";
import type { ShopInfoInput } from "../actions";

interface ShopInfoStepProps {
  onNext: (shopId: string) => void;
  onBack: () => void;
}

const PLATFORMS = [
  { value: "cafe24", label: "카페24" },
  { value: "imweb", label: "아임웹" },
  { value: "godomall", label: "고도몰" },
  { value: "other", label: "기타" },
] as const;

const INDUSTRIES = [
  { value: "clothing", label: "의류/패션" },
  { value: "food", label: "식품" },
  { value: "furniture", label: "가구/인테리어" },
  { value: "other", label: "기타" },
] as const;

export function ShopInfoStep({
  onNext,
  onBack,
}: ShopInfoStepProps): React.ReactElement {
  const [form, setForm] = useState<ShopInfoInput>({
    name: "",
    url: "",
    platform: "cafe24",
    industry: "clothing",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof ShopInfoInput>(
    key: K,
    value: ShopInfoInput[K]
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await createShop(form);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.shopId) {
      onNext(result.shopId);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2
          className="mb-1 text-xl font-bold tracking-tight"
          style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
        >
          쇼핑몰 정보
        </h2>
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          AI 최적화를 적용할 쇼핑몰 정보를 입력해주세요.
        </p>
      </div>

      {/* 쇼핑몰 이름 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shop-name">쇼핑몰 이름</Label>
        <Input
          id="shop-name"
          placeholder="예: 마이패션스토어"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
      </div>

      {/* URL */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shop-url">쇼핑몰 URL</Label>
        <Input
          id="shop-url"
          type="url"
          placeholder="https://mystore.cafe24.com"
          value={form.url}
          onChange={(e) => updateField("url", e.target.value)}
          required
        />
      </div>

      {/* 플랫폼 */}
      <div className="flex flex-col gap-1.5">
        <Label>플랫폼</Label>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => updateField("platform", p.value)}
              className="rounded-xl border px-3 py-2.5 text-sm font-medium transition-all"
              style={{
                borderColor:
                  form.platform === p.value
                    ? "var(--primary)"
                    : "var(--outline-variant)",
                background:
                  form.platform === p.value
                    ? "var(--primary-fixed)"
                    : "var(--surface-container-lowest)",
                color:
                  form.platform === p.value
                    ? "var(--on-primary-fixed)"
                    : "var(--on-surface-variant)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 업종 */}
      <div className="flex flex-col gap-1.5">
        <Label>업종</Label>
        <div className="grid grid-cols-2 gap-2">
          {INDUSTRIES.map((i) => (
            <button
              key={i.value}
              type="button"
              onClick={() => updateField("industry", i.value)}
              className="rounded-xl border px-3 py-2.5 text-sm font-medium transition-all"
              style={{
                borderColor:
                  form.industry === i.value
                    ? "var(--primary)"
                    : "var(--outline-variant)",
                background:
                  form.industry === i.value
                    ? "var(--primary-fixed)"
                    : "var(--surface-container-lowest)",
                color:
                  form.industry === i.value
                    ? "var(--on-primary-fixed)"
                    : "var(--on-surface-variant)",
              }}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--error)" }}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          이전
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "등록 중..." : "다음 →"}
        </Button>
      </div>
    </form>
  );
}
