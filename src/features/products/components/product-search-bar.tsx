"use client";

import type { ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "상태 (전체)" },
  { value: "pending", label: "미완료" },
  { value: "optimized", label: "완료" },
  { value: "failed", label: "실패" },
  { value: "manual_review", label: "수동확인" },
] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "name", label: "이름순" },
] as const;

export function ProductSearchBar(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all" || value === "newest") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams],
  );

  function handleSearch(): void {
    updateParams("query", query);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  function handleClear(): void {
    setQuery("");
    updateParams("query", "");
  }

  const statusParam = searchParams.get("status");
  const sortParam = searchParams.get("sort");
  const activeStatus: string = statusParam ?? "all";
  const activeSort: string = sortParam ?? "newest";
  const hasActiveFilters =
    searchParams.has("query") ||
    (searchParams.has("status") && searchParams.get("status") !== "all");

  return (
    <div className="bg-[var(--surface-container-low)] p-5 rounded-2xl mb-6 flex flex-wrap items-center gap-4">
      {/* 검색 */}
      <div className="flex-1 min-w-[240px] relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[var(--outline)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="상품명 또는 URL로 검색"
          className="pl-11 pr-4 py-3 h-auto bg-[var(--surface-container-lowest)] rounded-xl text-sm font-medium"
        />
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-3">
        <Select
          value={activeStatus}
          onValueChange={(v) => updateParams("status", v ?? "all")}
        >
          <SelectTrigger className="w-[160px] h-auto py-3 bg-[var(--surface-container-lowest)] rounded-xl text-sm font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={activeSort}
          onValueChange={(v) => updateParams("sort", v ?? "newest")}
        >
          <SelectTrigger className="w-[130px] h-auto py-3 bg-[var(--surface-container-lowest)] rounded-xl text-sm font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 활성 필터 태그 */}
      {hasActiveFilters && (
        <>
          <div className="h-8 w-px bg-[var(--outline-variant)]/30 hidden lg:block" />
          <button
            type="button"
            onClick={() => {
              setQuery("");
              router.push("/products");
            }}
            className="flex items-center gap-1.5 text-[var(--primary)] text-xs font-bold hover:underline px-2"
          >
            <X className="size-3" />
            필터 초기화
          </button>
        </>
      )}
    </div>
  );
}
