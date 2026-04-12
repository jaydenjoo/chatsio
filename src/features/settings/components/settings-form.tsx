"use client";

import { useState, useTransition, useCallback, type ReactElement } from "react";
import { Check, Loader2, Save, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfile, updateShop } from "../actions";
import type { SettingsData } from "../actions";

interface SettingsFormProps {
  readonly data: SettingsData;
}

const INDUSTRY_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "clothing", label: "의류" },
  { value: "food", label: "식품" },
  { value: "furniture", label: "가구/인테리어" },
  { value: "other", label: "기타" },
];

export function SettingsForm({ data }: SettingsFormProps): ReactElement {
  return (
    <div className="space-y-8">
      <ProfileSection
        fullName={data.profile.fullName}
        email={data.profile.email}
      />
      {data.shop && <ShopSection shop={data.shop} />}
    </div>
  );
}

// ============================================================
// 프로필 섹션
// ============================================================

function ProfileSection({
  fullName,
  email,
}: {
  readonly fullName: string | null;
  readonly email: string;
}): ReactElement {
  const [name, setName] = useState(fullName ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const result = await updateProfile({ fullName: name });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.error ?? "저장 실패");
      }
    });
  }, [name]);

  return (
    <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--primary-fixed)]/40 text-[var(--primary)]">
          <User className="size-5" />
        </div>
        <h3
          className="text-lg font-bold tracking-tight text-[var(--on-surface)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          프로필
        </h3>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-[var(--error)]/30 bg-[var(--error-container)] px-4 py-2 text-sm text-[var(--on-error-container)]">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--on-surface-variant)]">
            이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-2.5 text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--on-surface-variant)]">
            이메일
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container)] px-4 py-2.5 text-sm text-[var(--outline)] cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-[var(--outline)]">
            이메일은 변경할 수 없습니다
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="gap-2 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] shadow-md"
          >
            {saved ? (
              <Check className="size-4" />
            ) : isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saved ? "저장됨" : isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 쇼핑몰 섹션
// ============================================================

function ShopSection({
  shop,
}: {
  readonly shop: NonNullable<SettingsData["shop"]>;
}): ReactElement {
  const [name, setName] = useState(shop.name);
  const [url, setUrl] = useState(shop.url);
  const [industry, setIndustry] = useState(shop.industry);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const result = await updateShop({ name, url, industry });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.error ?? "저장 실패");
      }
    });
  }, [name, url, industry]);

  return (
    <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--success)]/10 text-[var(--success)]">
          <Store className="size-5" />
        </div>
        <h3
          className="text-lg font-bold tracking-tight text-[var(--on-surface)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          쇼핑몰 정보
        </h3>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-[var(--error)]/30 bg-[var(--error-container)] px-4 py-2 text-sm text-[var(--on-error-container)]">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--on-surface-variant)]">
            쇼핑몰 이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-2.5 text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--on-surface-variant)]">
            쇼핑몰 URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://myshop.com"
            className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-2.5 text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--on-surface-variant)]">
            업종
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-2.5 text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          >
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="gap-2 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] shadow-md"
          >
            {saved ? (
              <Check className="size-4" />
            ) : isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saved ? "저장됨" : isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
