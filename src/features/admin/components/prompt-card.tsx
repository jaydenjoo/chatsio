"use client";

import { useState, useTransition } from "react";
import { History, Pencil, Save, X, Plus } from "lucide-react";
import { StatusBadge } from "@/components/shared";
import { savePrompt } from "@/features/admin/actions/prompt-actions";
import type { PromptRow } from "@/features/admin/actions/prompt-actions";

// ============================================================
// 업종 라벨
// ============================================================

const INDUSTRY_LABEL: Record<string, string> = {
  clothing: "의류",
  food: "식품",
  furniture: "가구",
  other: "기타",
};

// ============================================================
// 날짜 포맷
// ============================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// 라인 번호 컴포넌트
// ============================================================

function LineNumbers({ count }: { readonly count: number }): React.ReactElement {
  return (
    <div
      className="select-none pr-3 text-right font-mono text-xs leading-6 text-outline/40"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}

// ============================================================
// PromptCard
// ============================================================

interface PromptCardProps {
  readonly prompt: PromptRow;
  readonly onToggleHistory: (promptId: string) => void;
  readonly isHistoryOpen: boolean;
}

export function PromptCard({
  prompt,
  onToggleHistory,
  isHistoryOpen,
}: PromptCardProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(prompt.content);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const lineCount = Math.max((isEditing ? content : prompt.content).split("\n").length, 1);

  function handleEdit(): void {
    setContent(prompt.content);
    setError(null);
    setIsEditing(true);
  }

  function handleCancel(): void {
    setContent(prompt.content);
    setError(null);
    setIsEditing(false);
  }

  function handleSave(): void {
    startTransition(async () => {
      const result = await savePrompt({ id: prompt.id, content });
      if (!result.success) {
        setError(result.error ?? "저장에 실패했습니다.");
        return;
      }
      setError(null);
      setIsEditing(false);
    });
  }

  return (
    <div className="rounded-2xl bg-surface-container-lowest shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg font-bold text-on-surface">
            {prompt.name}
          </h3>
          <StatusBadge
            status="info"
            label={INDUSTRY_LABEL[prompt.industry] ?? prompt.industry}
            size="sm"
          />
          <span className="rounded-full bg-surface-container px-2 py-0.5 font-mono text-[11px] font-semibold text-outline">
            v{prompt.version}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="mr-2 text-xs text-outline">
            {formatDate(prompt.updated_at)}
          </span>
          <button
            type="button"
            onClick={() => onToggleHistory(prompt.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              isHistoryOpen
                ? "bg-[#006195]/10 text-[#006195]"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            히스토리
          </button>
          {isEditing ? (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#006195] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#006195]/90 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {isPending ? "저장 중..." : "저장"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
            >
              <Pencil className="h-3.5 w-3.5" />
              편집
            </button>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mx-6 mb-3 rounded-lg bg-error-container/50 px-4 py-2 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {/* 편집기 / 미리보기 */}
      {isEditing ? (
        <div className="border-t border-outline-variant/10 px-6 py-4">
          <div className="flex overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container">
            <LineNumbers count={lineCount} />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 resize-none bg-transparent py-0 font-mono text-sm leading-6 text-on-surface outline-none placeholder:text-outline"
              rows={Math.min(lineCount + 2, 30)}
              spellCheck={false}
            />
          </div>
        </div>
      ) : (
        <div className="border-t border-outline-variant/10 px-6 py-4">
          <div className="flex overflow-hidden rounded-xl bg-surface-container/50">
            <LineNumbers count={Math.min(lineCount, 8)} />
            <pre className="flex-1 overflow-hidden text-ellipsis whitespace-pre-wrap py-0 font-mono text-sm leading-6 text-on-surface-variant">
              {prompt.content.split("\n").slice(0, 8).join("\n")}
              {lineCount > 8 && (
                <span className="text-outline">{`\n... (+${lineCount - 8}줄)`}</span>
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CreatePromptCard — 새 프롬프트 생성
// ============================================================

interface CreatePromptCardProps {
  readonly onCreated: () => void;
}

export function CreatePromptCard({
  onCreated,
}: CreatePromptCardProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState<string>("clothing");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate(): void {
    startTransition(async () => {
      const { createPrompt } = await import(
        "@/features/admin/actions/prompt-actions"
      );
      const result = await createPrompt({ industry, name, content });
      if (!result.success) {
        setError(result.error ?? "생성에 실패했습니다.");
        return;
      }
      setName("");
      setIndustry("clothing");
      setContent("");
      setError(null);
      setIsOpen(false);
      onCreated();
    });
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant/30 py-8 text-sm font-semibold text-outline transition-colors hover:border-[#006195]/40 hover:text-[#006195]"
      >
        <Plus className="h-4 w-4" />
        새 프롬프트 추가
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-surface-container-lowest shadow-[var(--shadow-md)]">
      <div className="px-6 py-4">
        <h3 className="font-display text-lg font-bold text-on-surface">
          새 프롬프트
        </h3>

        {error && (
          <div className="mt-3 rounded-lg bg-error-container/50 px-4 py-2 text-sm text-on-error-container">
            {error}
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 의류 상품 JSON-LD 추출"
              className="w-full rounded-xl bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-[#006195]/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
              업종
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-xl bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-[#006195]/30"
            >
              {Object.entries(INDUSTRY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
            프롬프트 내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="프롬프트 내용을 입력하세요..."
            rows={10}
            className="w-full resize-none rounded-xl bg-surface-container px-4 py-3 font-mono text-sm leading-6 text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-[#006195]/30"
            spellCheck={false}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setError(null);
            }}
            disabled={isPending}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending || !name.trim() || !content.trim()}
            className="rounded-lg bg-[#006195] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006195]/90 disabled:opacity-50"
          >
            {isPending ? "생성 중..." : "생성"}
          </button>
        </div>
      </div>
    </div>
  );
}
