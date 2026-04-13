"use client";

import { useState, useTransition, type ReactElement } from "react";
import { Sparkles, Search, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  generateQuestions,
  runCitationCheck,
  type CitationCheckResult,
} from "@/features/admin/actions/citation-actions";

// ============================================================
// 타입
// ============================================================

interface Product {
  readonly id: string;
  readonly name: string;
  readonly shopName: string;
}

interface CitationRunnerProps {
  readonly products: readonly Product[];
}

// ============================================================
// 컴포넌트
// ============================================================

export function CitationRunner({ products }: CitationRunnerProps): ReactElement {
  const [selectedId, setSelectedId] = useState<string>("");
  const [questions, setQuestions] = useState<readonly string[]>([]);
  const [checkResult, setCheckResult] = useState<CitationCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isGenerating, startGenerating] = useTransition();
  const [isChecking, startChecking] = useTransition();

  const selectedProduct = products.find((p) => p.id === selectedId);

  function handleGenerate(): void {
    if (!selectedId) return;
    setError(null);
    setCheckResult(null);

    startGenerating(async () => {
      const result = await generateQuestions(selectedId);
      if (result.success && result.data) {
        setQuestions(result.data.questions);
      } else {
        setError(result.error ?? "질문 생성에 실패했습니다.");
      }
    });
  }

  function handleCheck(): void {
    if (!selectedId || questions.length === 0) return;
    setError(null);

    startChecking(async () => {
      const result = await runCitationCheck(selectedId);
      if (result.success && result.data) {
        setCheckResult(result.data);
      } else {
        setError(result.error ?? "인용 체크에 실패했습니다.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* 상품 선택 */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[var(--shadow-sm)]">
        <h3 className="font-display text-lg font-bold text-on-surface">
          상품 선택
        </h3>
        <p className="mt-1 text-xs text-on-surface-variant">
          최적화가 완료된 상품 중 인용 추적할 상품을 선택하세요.
        </p>

        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="product-select" className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
              상품
            </label>
            <select
              id="product-select"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setQuestions([]);
                setCheckResult(null);
                setError(null);
              }}
              className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">상품을 선택하세요</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.shopName}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!selectedId || isGenerating}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            질문 생성
          </button>
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-error-container/30 px-5 py-3 text-sm text-on-error-container">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 생성된 질문 목록 */}
      {questions.length > 0 && (
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-on-surface">
                생성된 질문 ({questions.length}개)
              </h3>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                {selectedProduct?.name} — ChatGPT에 질의할 구매 의도 질문
              </p>
            </div>
            <button
              type="button"
              onClick={handleCheck}
              disabled={isChecking}
              className="flex items-center gap-2 rounded-xl bg-tertiary px-5 py-2.5 text-sm font-semibold text-on-tertiary transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              인용 체크 실행
            </button>
          </div>

          <ol className="mt-4 space-y-2">
            {questions.map((q, i) => (
              <li
                key={q}
                className="flex items-start gap-3 rounded-lg bg-surface-container-low/50 px-4 py-2.5 text-sm text-on-surface"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                {q}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 인용 체크 로딩 */}
      {isChecking && (
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-surface-container-lowest p-12 shadow-[var(--shadow-sm)]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-on-surface-variant">
            ChatGPT에 {questions.length}개 질문 질의 중... (약 5~10초)
          </span>
        </div>
      )}

      {/* 결과 */}
      {checkResult && (
        <div className="rounded-2xl bg-surface-container-lowest shadow-[var(--shadow-sm)]">
          {/* 스코어 헤더 */}
          <div className="flex items-center justify-between border-b border-outline-variant/10 px-6 py-5">
            <div>
              <h3 className="font-display text-lg font-bold text-on-surface">
                인용 체크 결과
              </h3>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Run ID: {checkResult.runId.slice(0, 8)}…
              </p>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-extrabold text-primary">
                {checkResult.productScore}
              </div>
              <div className="text-xs text-on-surface-variant">Citation Score</div>
            </div>
          </div>

          {/* 질문별 결과 테이블 */}
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 text-xs font-bold uppercase tracking-wider text-outline">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">질문</th>
                <th className="px-6 py-3 text-center">인용 여부</th>
                <th className="px-6 py-3 text-center">이름</th>
                <th className="px-6 py-3 text-center">URL</th>
                <th className="px-6 py-3 text-right">점수</th>
              </tr>
            </thead>
            <tbody>
              {checkResult.results.map((r, i) => (
                <tr
                  key={r.questionText}
                  className="border-b border-outline-variant/5 transition-colors hover:bg-surface-container-low/50"
                >
                  <td className="px-6 py-3 text-on-surface-variant">{i + 1}</td>
                  <td className="max-w-xs truncate px-6 py-3 text-on-surface" title={r.questionText}>
                    {r.questionText}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {r.isCited ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                        <CheckCircle2 className="h-3 w-3" /> 인용됨
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-outline/10 px-2.5 py-0.5 text-xs font-semibold text-outline">
                        <XCircle className="h-3 w-3" /> 미인용
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {r.matchedName ? (
                      <CheckCircle2 className="mx-auto h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="mx-auto h-4 w-4 text-outline/40" />
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {r.matchedUrl ? (
                      <CheckCircle2 className="mx-auto h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="mx-auto h-4 w-4 text-outline/40" />
                    )}
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-on-surface">
                    {r.citationScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ChatGPT 응답 상세 (접기) */}
          <details className="border-t border-outline-variant/10">
            <summary className="cursor-pointer px-6 py-3 text-xs font-semibold text-on-surface-variant hover:text-on-surface">
              ChatGPT 원문 응답 보기
            </summary>
            <div className="space-y-4 px-6 pb-6">
              {checkResult.results.map((r, idx) => (
                <div key={r.questionText} className="rounded-lg bg-surface-container-low/50 p-4">
                  <div className="mb-2 text-xs font-semibold text-primary">
                    질문 {idx + 1}: {r.questionText}
                  </div>
                  <div className="whitespace-pre-wrap text-xs leading-relaxed text-on-surface-variant">
                    {r.aiResponse}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
