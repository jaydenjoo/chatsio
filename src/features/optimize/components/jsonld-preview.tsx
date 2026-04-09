"use client";

import { useState, type ReactElement } from "react";
import { Check, Copy, ExternalLink, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JsonldPreviewProps {
  readonly jsonld: Record<string, unknown> | null;
}

const COPIED_RESET_MS = 1500;
const GOOGLE_RICH_RESULTS_URL = "https://search.google.com/test/rich-results";

type CopyState = "idle" | "copied" | "failed";

export function JsonldPreview({ jsonld }: JsonldPreviewProps): ReactElement {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  if (jsonld === null || Object.keys(jsonld).length === 0) {
    return <EmptyState />;
  }

  const pretty = JSON.stringify(jsonld, null, 2);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(pretty);
      setCopyState("copied");
    } catch {
      // HTTPS 아닌 환경 또는 권한 거부 시 textarea fallback
      try {
        const textarea = document.createElement("textarea");
        textarea.value = pretty;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopyState("copied");
      } catch {
        setCopyState("failed");
      }
    } finally {
      setTimeout(() => setCopyState("idle"), COPIED_RESET_MS);
    }
  }

  return (
    <div className="space-y-4">
      {/* 코드 블록 카드 */}
      <div className="overflow-hidden rounded-3xl bg-[var(--surface-container-lowest)] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between gap-3 border-b-0 bg-[var(--surface-container-low)] px-6 py-4">
          <div className="flex items-center gap-2">
            <FileJson className="size-4 text-[var(--primary)]" />
            <p
              className="text-sm font-bold text-[var(--on-surface)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              JSON-LD 코드
            </p>
          </div>
          <Button
            onClick={handleCopy}
            size="sm"
            className="gap-2 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] shadow-md hover:scale-[1.02] transition-transform"
          >
            {copyState === "copied" ? (
              <>
                <Check className="size-4" />
                복사됨
              </>
            ) : copyState === "failed" ? (
              "복사 실패"
            ) : (
              <>
                <Copy className="size-4" />
                복사
              </>
            )}
          </Button>
        </div>
        <pre
          className="max-h-[480px] overflow-auto px-6 py-5 text-xs leading-relaxed text-[var(--on-surface)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <code>{pretty}</code>
        </pre>
      </div>

      {/* Google Rich Results 안내 카드 */}
      <div className="rounded-3xl bg-[var(--surface-container-low)] p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-fixed)]/40 text-[var(--primary)]">
            <ExternalLink className="size-5" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-bold text-[var(--on-surface)]">
              Google Rich Results Test로 검증하기
            </p>
            <p className="text-xs leading-relaxed text-[var(--on-surface-variant)]">
              위 코드를 복사해서 Google Rich Results Test에 붙여넣으면 검색
              결과에 리치 스니펫으로 노출되는지 확인할 수 있습니다.
            </p>
            <a
              href={GOOGLE_RICH_RESULTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
            >
              Google Rich Results Test 열기
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState(): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-[var(--surface-container-lowest)] p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--surface-container)] text-[var(--outline)]">
        <FileJson className="size-6" />
      </div>
      <p className="text-base font-bold text-[var(--on-surface)]">
        JSON-LD 데이터가 없습니다
      </p>
      <p className="max-w-sm text-sm text-[var(--on-surface-variant)]">
        이번 최적화에서 JSON-LD 코드 블록이 생성되지 않았습니다. 속성 목록
        탭에서 추출된 데이터를 확인하세요.
      </p>
    </div>
  );
}
