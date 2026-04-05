"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFirstProduct } from "../actions";
import type { FirstProductInput } from "../actions";

interface FirstProductStepProps {
  shopId: string;
  onNext: () => void;
  onBack: () => void;
}

export function FirstProductStep({
  shopId,
  onNext,
  onBack,
}: FirstProductStepProps): React.ReactElement {
  const [form, setForm] = useState<FirstProductInput>({
    name: "",
    url: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof FirstProductInput>(
    key: K,
    value: FirstProductInput[K]
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await addFirstProduct(shopId, form);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2
          className="mb-1 text-xl font-bold tracking-tight"
          style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
        >
          첫 상품 등록
        </h2>
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          AI 최적화를 체험할 첫 상품을 등록해주세요.
        </p>
      </div>

      {/* 상품명 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-name">상품명</Label>
        <Input
          id="product-name"
          placeholder="예: 오버핏 코튼 반팔 티셔츠"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
      </div>

      {/* 상품 URL */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-url">
          상품 URL{" "}
          <span className="font-normal" style={{ color: "var(--outline)" }}>
            (선택)
          </span>
        </Label>
        <Input
          id="product-url"
          type="url"
          placeholder="https://mystore.cafe24.com/product/123"
          value={form.url ?? ""}
          onChange={(e) => updateField("url", e.target.value)}
        />
        <p className="text-xs" style={{ color: "var(--outline)" }}>
          상품 페이지 URL이 있으면 AI가 이미지를 자동으로 수집합니다.
        </p>
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
