"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { FileText, Upload, CheckCircle2, AlertCircle, Download, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createProductsBulk,
  hasFormulaInjection,
  BULK_MAX_ROWS,
  BULK_MAX_NAME,
  BULK_MAX_URL,
} from "@/features/products";
import type { BulkFailedRow, BulkRowInput } from "@/features/products";

// ============================================================
// 상수 — 서버 상한은 validation.ts에서 import. 파일 크기만 클라이언트 전용.
// ============================================================

const CSV_MAX_BYTES = 1 * 1024 * 1024; // 1MB (클라이언트 사전 필터)

// ============================================================
// 타입
// ============================================================

interface ParsedRow {
  row: number; // 1-based (데이터 기준, 헤더 제외)
  name: string;
  url: string;
  error: string | null;
}

type Phase = "idle" | "preview" | "result";

interface SubmitResult {
  successCount: number;
  failedRows: BulkFailedRow[];
}

// ============================================================
// 검증 유틸 (클라이언트 사전 검증)
// ============================================================

function validateRow(name: string, url: string): string | null {
  if (!name) return "상품명이 비어있습니다";
  if (name.length > BULK_MAX_NAME) return `상품명은 ${BULK_MAX_NAME}자 이하여야 합니다`;
  if (hasFormulaInjection(name)) return "상품명에 허용되지 않은 문자가 있습니다";

  if (!url) return "URL이 비어있습니다";
  if (url.length > BULK_MAX_URL) return `URL은 ${BULK_MAX_URL}자 이하여야 합니다`;
  if (hasFormulaInjection(url)) return "URL에 허용되지 않은 문자가 있습니다";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "http:// 또는 https:// URL만 허용됩니다";
  }
  try {
    new URL(url);
  } catch {
    return "올바른 URL 형식이 아닙니다";
  }
  return null;
}

// ============================================================
// 컴포넌트
// ============================================================

export function CsvUploadForm(): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFileSelect(file: File): void {
    setParseError(null);
    setParsedRows([]);
    setFileName(file.name);

    // 1. 확장자 검증
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError(".csv 파일만 업로드할 수 있습니다");
      return;
    }

    // 2. 크기 검증
    if (file.size > CSV_MAX_BYTES) {
      setParseError(`파일 크기는 1MB 이하여야 합니다 (현재 ${(file.size / 1024).toFixed(0)}KB)`);
      return;
    }

    // 3. papaparse로 파싱
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        // 헤더 검증
        const fields = results.meta.fields ?? [];
        if (!fields.includes("name") || !fields.includes("url")) {
          setParseError("헤더에 'name'과 'url' 컬럼이 필요합니다");
          return;
        }

        const rawData = results.data;
        if (rawData.length === 0) {
          setParseError("CSV에 데이터 행이 없습니다");
          return;
        }

        if (rawData.length > BULK_MAX_ROWS) {
          setParseError(`한 번에 ${BULK_MAX_ROWS}행까지만 등록할 수 있습니다 (현재 ${rawData.length}행)`);
          return;
        }

        // 4. 행별 검증
        const rows: ParsedRow[] = rawData.map((raw, idx) => {
          const name = (raw.name ?? "").trim();
          const url = (raw.url ?? "").trim();
          return {
            row: idx + 1,
            name,
            url,
            error: validateRow(name, url),
          };
        });

        setParsedRows(rows);
        setPhase("preview");
      },
      error: () => {
        setParseError("CSV 파일을 읽을 수 없습니다. 파일 형식을 확인해주세요.");
      },
    });
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  // 드래그앤드롭 핸들러
  function handleDragOver(e: React.DragEvent<HTMLLabelElement>): void {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragEnter(e: React.DragEvent<HTMLLabelElement>): void {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLLabelElement>): void {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>): void {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleReset(): void {
    setPhase("idle");
    setFileName("");
    setParsedRows([]);
    setParseError(null);
    setSubmitError(null);
    setSubmitResult(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(): void {
    const validRows: BulkRowInput[] = parsedRows
      .filter((r) => r.error === null)
      .map((r) => ({ name: r.name, url: r.url }));

    if (validRows.length === 0) return;

    setSubmitError(null);

    startTransition(async () => {
      const result = await createProductsBulk(validRows);

      // 시스템 에러 (인증/shop 없음 등) — error 필드가 채워진 경우
      if (!result.success && result.error) {
        setSubmitError(result.error);
        return;
      }

      // 부분/전체 성공 또는 "전체 DB insert 실패" — 결과 화면으로
      // (successCount === 0 && failedRows > 0 인 경우도 결과 화면에서 실패 UI로 분기)
      setSubmitResult({
        successCount: result.successCount,
        failedRows: result.failedRows,
      });
      setPhase("result");
    });
  }

  // ============================================================
  // 렌더링
  // ============================================================

  const validCount = parsedRows.filter((r) => r.error === null).length;
  const invalidCount = parsedRows.length - validCount;

  // Phase 1: 파일 선택
  if (phase === "idle") {
    return (
      <div className="space-y-6">
        <label
          htmlFor="csv-file-input"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
            isDragging
              ? "border-[var(--primary)] bg-[var(--primary-container)]/30"
              : "border-[var(--outline-variant)] bg-[var(--surface-container-highest)] hover:border-[var(--primary)] hover:bg-[var(--surface-container)]"
          }`}
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--primary-container)]/20">
            <Upload className="size-7 text-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-[var(--on-surface)]">
              {isDragging ? "여기에 드롭하세요" : "CSV 파일을 선택하거나 여기로 드래그"}
            </p>
            <p className="text-sm text-[var(--on-surface-variant)]">
              최대 {BULK_MAX_ROWS}행 · 최대 1MB · UTF-8 인코딩
            </p>
          </div>
          <input
            ref={fileInputRef}
            id="csv-file-input"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleFileInputChange}
          />
        </label>

        {parseError && (
          <div className="flex items-start gap-3 rounded-xl bg-[var(--error-container)] px-4 py-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--on-error-container)]" />
            <p className="text-sm font-medium text-[var(--on-error-container)]">{parseError}</p>
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl bg-[var(--surface-container-low)] px-5 py-4">
          <div className="flex items-center gap-3">
            <FileText className="size-4 text-[var(--on-surface-variant)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--on-surface)]">CSV 형식</p>
              <p className="text-xs text-[var(--on-surface-variant)]">
                첫 줄: <code className="rounded bg-[var(--surface-container-highest)] px-1.5 py-0.5 text-xs">name,url</code>
              </p>
            </div>
          </div>
          <a
            href="/templates/products-sample.csv"
            download
            className="flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            <Download className="size-3.5" />
            샘플 다운로드
          </a>
        </div>
      </div>
    );
  }

  // Phase 2: 미리보기
  if (phase === "preview") {
    return (
      <div className="space-y-6">
        {/* 요약 카드 */}
        <div className="rounded-2xl bg-[var(--surface-container-low)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="size-4 text-[var(--on-surface-variant)]" />
              <span className="text-sm font-semibold text-[var(--on-surface)]">{fileName}</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            >
              <RotateCcw className="size-3" />
              다른 파일 선택
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[var(--surface-container-lowest)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--on-surface-variant)]">전체</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--on-surface)]">
                {parsedRows.length}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--surface-container-lowest)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--on-surface-variant)]">유효</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--primary)]">{validCount}</p>
            </div>
            <div className="rounded-xl bg-[var(--surface-container-lowest)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--on-surface-variant)]">무효</p>
              <p
                className={`mt-1 text-2xl font-extrabold ${invalidCount > 0 ? "text-[var(--error)]" : "text-[var(--on-surface-variant)]"}`}
              >
                {invalidCount}
              </p>
            </div>
          </div>
        </div>

        {/* 미리보기 테이블 (첫 10행 + 에러 행 전부) */}
        <PreviewTable rows={parsedRows} />

        {/* 에러 요약 */}
        {invalidCount > 0 && (
          <div className="space-y-2 rounded-xl bg-[var(--error-container)]/40 p-4">
            <p className="text-sm font-bold text-[var(--on-surface)]">
              검증 실패 {invalidCount}행 (등록에서 제외됨)
            </p>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-[var(--on-surface-variant)]">
              {parsedRows
                .filter((r) => r.error !== null)
                .slice(0, 20)
                .map((r) => (
                  <li key={r.row}>
                    <span className="font-semibold">#{r.row}</span>: {r.error}
                  </li>
                ))}
              {invalidCount > 20 && (
                <li className="italic">... 외 {invalidCount - 20}행</li>
              )}
            </ul>
          </div>
        )}

        {submitError && (
          <div className="flex items-start gap-3 rounded-xl bg-[var(--error-container)] px-4 py-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--on-error-container)]" />
            <p className="text-sm font-medium text-[var(--on-error-container)]">{submitError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={isPending}
            className="px-6 font-bold text-[var(--outline)] hover:text-[var(--on-surface)]"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || validCount === 0}
            className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] px-8 py-6 font-extrabold text-[var(--on-primary)] shadow-md transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {isPending ? "등록 중..." : `${validCount}행 등록하기`}
          </Button>
        </div>
      </div>
    );
  }

  // Phase 3: 결과
  if (phase === "result" && submitResult) {
    const { successCount, failedRows } = submitResult;
    const isTotalFailure = successCount === 0;
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-[var(--surface-container-low)] px-6 py-10 text-center">
          <div
            className={`flex size-16 items-center justify-center rounded-full ${
              isTotalFailure
                ? "bg-[var(--error-container)]"
                : "bg-[var(--primary-container)]/20"
            }`}
          >
            {isTotalFailure ? (
              <XCircle className="size-8 text-[var(--error)]" />
            ) : (
              <CheckCircle2 className="size-8 text-[var(--primary)]" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-extrabold text-[var(--on-surface)]">
              {isTotalFailure ? "등록 실패" : `${successCount}개 등록 완료`}
            </h3>
            {failedRows.length > 0 && (
              <p className="text-sm text-[var(--on-surface-variant)]">
                {isTotalFailure
                  ? `${failedRows.length}개 행 모두 실패했습니다`
                  : `${failedRows.length}개 실패`}
              </p>
            )}
          </div>
        </div>

        {failedRows.length > 0 && (
          <div className="space-y-2 rounded-xl bg-[var(--error-container)]/40 p-4">
            <p className="text-sm font-bold text-[var(--on-surface)]">실패한 행</p>
            <ul className="max-h-60 space-y-2 overflow-y-auto text-xs text-[var(--on-surface-variant)]">
              {failedRows.map((r) => (
                <li key={r.row} className="space-y-0.5">
                  <div>
                    <span className="font-semibold text-[var(--on-surface)]">#{r.row}</span>{" "}
                    {r.message}
                  </div>
                  {(r.name || r.url) && (
                    <div className="pl-4 text-[11px] text-[var(--outline)]">
                      {r.name && <span>{r.name}</span>}
                      {r.name && r.url && <span> · </span>}
                      {r.url && <span className="break-all">{r.url}</span>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="px-6 font-bold text-[var(--outline)] hover:text-[var(--on-surface)]"
          >
            다시 등록
          </Button>
          {!isTotalFailure && (
            <Button
              type="button"
              onClick={() => router.push("/products")}
              className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] px-8 py-6 font-extrabold text-[var(--on-primary)] shadow-md transition-transform hover:scale-[1.02]"
            >
              상품 목록 보기
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 도달 불가능 — phase가 "result"인데 submitResult가 null이거나, 미래에
  // Phase union이 확장되었는데 렌더링을 추가하지 않은 경우. 조용히 빈
  // fragment 반환 대신 명시적으로 알려서 버그를 일찍 잡는다.
  throw new Error(
    `CsvUploadForm: unexpected render state (phase="${phase}", hasResult=${submitResult !== null})`,
  );
}

// ============================================================
// 미리보기 테이블 (내부 컴포넌트)
// ============================================================

function PreviewTable({ rows }: { rows: ParsedRow[] }): React.ReactElement {
  // 첫 30행 미리보기 (원본 행 순서 보존). 에러 행 전체 목록은
  // 테이블 아래 "검증 실패" 요약 섹션에서 별도로 보여준다.
  const visible = rows.slice(0, 30);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--surface-container)] text-xs font-semibold text-[var(--on-surface-variant)]">
          <tr>
            <th className="px-4 py-2.5 w-12">#</th>
            <th className="px-4 py-2.5">상품명</th>
            <th className="px-4 py-2.5">URL</th>
            <th className="px-4 py-2.5 w-24">상태</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr
              key={r.row}
              className={`border-t border-[var(--outline-variant)] ${
                r.error ? "bg-[var(--error-container)]/20" : ""
              }`}
            >
              <td className="px-4 py-2.5 font-mono text-xs text-[var(--on-surface-variant)]">
                {r.row}
              </td>
              <td className="px-4 py-2.5 text-[var(--on-surface)]">
                <div className="max-w-[200px] truncate">{r.name || "—"}</div>
              </td>
              <td className="px-4 py-2.5 text-[var(--on-surface-variant)]">
                <div className="max-w-[280px] truncate font-mono text-xs">{r.url || "—"}</div>
              </td>
              <td className="px-4 py-2.5">
                {r.error ? (
                  <span
                    title={r.error}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--error-container)] px-2 py-0.5 text-[10px] font-bold text-[var(--on-error-container)]"
                  >
                    <AlertCircle className="size-3" />
                    오류
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-container)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                    <CheckCircle2 className="size-3" />
                    유효
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > visible.length && (
        <div className="border-t border-[var(--outline-variant)] bg-[var(--surface-container)] px-4 py-2 text-center text-xs text-[var(--on-surface-variant)]">
          ... 외 {rows.length - visible.length}행
        </div>
      )}
    </div>
  );
}
