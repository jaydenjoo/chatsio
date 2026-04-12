"use client";

import { useState, useTransition, useCallback, type ReactElement } from "react";
import {
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateLlmsTxt } from "../actions";

const COPIED_RESET_MS = 1500;

type CopyState = "idle" | "copied" | "failed";

export function LlmsTxtPreview(): ReactElement {
  const [text, setText] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const result = await generateLlmsTxt();
      if (result.success && result.text) {
        setText(result.text);
        setShopName(result.shopName ?? "shop");
      } else {
        setError(result.error ?? "생성에 실패했습니다.");
      }
    });
  }, []);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    } finally {
      setTimeout(() => setCopyState("idle"), COPIED_RESET_MS);
    }
  }, [text]);

  const handleDownload = useCallback(() => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "llms.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [text]);

  return (
    <div className="space-y-6">
      {/* 헤더 + 설명 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--primary-fixed)]/40 text-[var(--primary)]">
            <FileText className="size-5" />
          </div>
          <div>
            <h3
              className="text-lg font-bold tracking-tight text-[var(--on-surface)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              llms.txt 생성
            </h3>
            <p className="text-sm text-[var(--on-surface-variant)]">
              AI 검색엔진이 읽을 수 있는 상품 정보 파일
            </p>
          </div>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="rounded-2xl border border-[var(--error)]/30 bg-[var(--error-container)] px-4 py-3 text-sm text-[var(--on-error-container)]">
          {error}
        </div>
      )}

      {/* 미생성 상태 */}
      {!text && !error && (
        <div className="rounded-3xl border-2 border-dashed border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-12 text-center">
          <p className="mb-2 text-sm text-[var(--on-surface-variant)]">
            완료된 최적화 결과를 기반으로 llms.txt를 생성합니다.
          </p>
          <p className="mb-6 text-xs text-[var(--outline)]">
            생성된 파일을 쇼핑몰 루트에 업로드하면 AI 검색엔진이 상품 정보를
            읽을 수 있습니다.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={isPending}
            className="gap-2 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] shadow-lg transition-transform hover:scale-[1.02]"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            {isPending ? "생성 중..." : "llms.txt 생성하기"}
          </Button>
        </div>
      )}

      {/* 미리보기 + 액션 버튼 */}
      {text && (
        <div className="space-y-4">
          {/* 액션 바 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--on-surface-variant)]">
              {shopName} — llms.txt
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleGenerate}
                disabled={isPending}
                className="gap-1.5 text-[var(--on-surface-variant)]"
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                새로고침
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="gap-1.5 text-[var(--primary)]"
              >
                {copyState === "copied" ? (
                  <>
                    <Check className="size-3.5" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    복사
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleDownload}
                className="gap-1.5 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] shadow-md"
              >
                <Download className="size-3.5" />
                다운로드
              </Button>
            </div>
          </div>

          {/* 코드 블록 */}
          <div className="overflow-hidden rounded-2xl bg-[var(--surface-container)] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
            <pre className="max-h-[500px] overflow-auto p-6 text-xs leading-relaxed text-[var(--on-surface)]">
              {text}
            </pre>
          </div>

          {/* 안내 */}
          <div className="flex items-start gap-3 rounded-2xl bg-[var(--primary-fixed)]/20 p-4">
            <FileText className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
            <div className="space-y-1 text-xs text-[var(--on-surface-variant)]">
              <p className="font-semibold text-[var(--on-surface)]">
                다운로드 후 쇼핑몰에 업로드하세요
              </p>
              <p>
                llms.txt 파일을 쇼핑몰 루트 디렉토리(yourshop.com/llms.txt)에
                업로드하면 AI 검색엔진이 상품 정보를 읽을 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
