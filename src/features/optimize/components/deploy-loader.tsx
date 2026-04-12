"use client";

import { useState, useCallback, type ReactElement } from "react";
import { Check, Copy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeployLoaderProps {
  readonly shopId: string | undefined;
}

const COPIED_RESET_MS = 1500;

export function DeployLoader({ shopId }: DeployLoaderProps): ReactElement {
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const loaderScript = shopId
    ? `<!-- Chatsio JSON-LD Loader -->\n<script src="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://chatsio-topaz.vercel.app"}/api/v1/loader/${shopId}" defer></script>`
    : "";

  const handleCopy = useCallback(async () => {
    if (!loaderScript) return;
    try {
      await navigator.clipboard.writeText(loaderScript);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), COPIED_RESET_MS);
    } catch {
      // clipboard API 실패 무시
    }
  }, [loaderScript]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--success)]/10 text-[var(--success)]">
          <Zap className="size-5" />
        </div>
        <div>
          <h3
            className="text-lg font-bold tracking-tight text-[var(--on-surface)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Loader JS (자동 적용)
          </h3>
          <p className="text-sm text-[var(--on-surface-variant)]">
            스크립트 한 줄로 모든 상품 페이지에 자동 적용
          </p>
        </div>
      </div>

      <p className="text-sm text-[var(--on-surface-variant)]">
        아래 코드를 쇼핑몰의 공통{" "}
        <code className="rounded bg-[var(--surface-container)] px-1.5 py-0.5 text-xs font-mono">
          {"<head>"}
        </code>{" "}
        에 한 번만 추가하면, 각 상품 페이지에 맞는 JSON-LD가 자동으로 주입됩니다.
      </p>

      {shopId ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--outline-variant)]/30 bg-[var(--surface-container-lowest)]">
          <div className="flex items-center justify-between border-b border-[var(--outline-variant)]/20 bg-[var(--surface-container-low)] px-5 py-3">
            <span className="text-xs font-semibold text-[var(--on-surface-variant)]">
              HTML
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="gap-1.5 text-[var(--primary)]"
            >
              {copyState === "copied" ? (
                <>
                  <Check className="size-3" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  복사
                </>
              )}
            </Button>
          </div>
          <pre className="p-5 text-xs leading-relaxed text-[var(--on-surface)]">
            {loaderScript}
          </pre>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[var(--outline-variant)] p-6 text-center text-sm text-[var(--on-surface-variant)]">
          쇼핑몰 정보를 먼저 등록해주세요.
        </div>
      )}

      {/* 작동 원리 안내 */}
      <div className="space-y-2 rounded-2xl bg-[var(--surface-container-low)] p-4 text-xs text-[var(--on-surface-variant)]">
        <p className="font-semibold text-[var(--on-surface)]">작동 원리</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>방문자가 상품 페이지를 열면 Loader JS가 현재 URL을 읽습니다</li>
          <li>Chatsio API에서 해당 상품의 JSON-LD를 조회합니다</li>
          <li>
            매칭되는 JSON-LD가 있으면{" "}
            <code className="rounded bg-[var(--surface-container)] px-1 py-0.5 font-mono">
              {"<head>"}
            </code>{" "}
            에 자동 삽입합니다
          </li>
          <li>Google/AI 검색엔진이 구조화 데이터를 인식합니다</li>
        </ol>
      </div>
    </div>
  );
}
