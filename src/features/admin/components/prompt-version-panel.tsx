"use client";

import { useEffect, useState, useTransition } from "react";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import {
  getPromptVersions,
  rollbackPrompt,
} from "@/features/admin/actions/prompt-actions";
import type { PromptVersionRow } from "@/features/admin/actions/prompt-actions";

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
// 버전 아이템
// ============================================================

function VersionItem({
  version,
  promptId,
  onRollback,
}: {
  readonly version: PromptVersionRow;
  readonly promptId: string;
  readonly onRollback: () => void;
}): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRollback(): void {
    if (!confirm(`v${version.version}으로 롤백하시겠습니까?`)) return;

    startTransition(async () => {
      const result = await rollbackPrompt({
        promptId,
        versionId: version.id,
      });
      if (result.success) {
        onRollback();
      }
    });
  }

  return (
    <div className="border-b border-outline-variant/10 last:border-0">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm text-on-surface transition-colors hover:text-[#006195]"
        >
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          <span className="font-mono font-semibold">v{version.version}</span>
          <span className="text-xs text-outline">
            {formatDate(version.created_at)}
          </span>
        </button>
        <button
          type="button"
          onClick={handleRollback}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-[#006195] disabled:opacity-50"
        >
          <RotateCcw className="h-3 w-3" />
          {isPending ? "롤백 중..." : "롤백"}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-3">
          <pre className="max-h-60 overflow-auto rounded-lg bg-surface-container p-3 font-mono text-xs leading-5 text-on-surface-variant">
            {version.content}
          </pre>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PromptVersionPanel
// ============================================================

interface PromptVersionPanelProps {
  readonly promptId: string;
}

export function PromptVersionPanel({
  promptId,
}: PromptVersionPanelProps): React.ReactElement {
  const [versions, setVersions] = useState<readonly PromptVersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadVersions(): Promise<void> {
    setLoading(true);
    const result = await getPromptVersions(promptId);
    if (result.success && result.data) {
      setVersions(result.data);
      setError(null);
    } else {
      setError(result.error ?? "버전 히스토리를 불러올 수 없습니다.");
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId]);

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-container/50 px-6 py-8 text-center text-sm text-outline">
        버전 히스토리 로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-error-container/30 px-6 py-4 text-sm text-on-error-container">
        {error}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container/50 px-6 py-8 text-center text-sm text-outline">
        아직 버전 히스토리가 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest">
      <div className="border-b border-outline-variant/10 px-4 py-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
          버전 히스토리 ({versions.length}개)
        </h4>
      </div>
      {versions.map((version) => (
        <VersionItem
          key={version.id}
          version={version}
          promptId={promptId}
          onRollback={() => void loadVersions()}
        />
      ))}
    </div>
  );
}
