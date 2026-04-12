"use client";

import { useCallback } from "react";
import type { ReactElement } from "react";
import { Download } from "lucide-react";

interface CSVExportProps {
  readonly filename: string;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
  readonly label?: string;
}

// CSV Injection 방어 — Excel 수식 트리거 문자 무력화
const FORMULA_TRIGGERS = new Set(["=", "+", "-", "@", "\t", "\r"]);

function sanitizeFormula(value: string): string {
  if (value.length > 0 && FORMULA_TRIGGERS.has(value[0]!)) {
    return `\t${value}`;
  }
  return value;
}

function escapeCell(value: string): string {
  const safe = sanitizeFormula(value);
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function buildCSV(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const headerLine = headers.map(escapeCell).join(",");
  const dataLines = rows.map((row) => row.map(escapeCell).join(","));
  return [headerLine, ...dataLines].join("\n");
}

function getDateSuffix(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CSVExport({
  filename,
  headers,
  rows,
  label,
}: CSVExportProps): ReactElement {
  const handleDownload = useCallback(() => {
    const csv = buildCSV(headers, rows);
    // BOM 추가 — Excel에서 한글 깨짐 방지
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${getDateSuffix()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [filename, headers, rows]);

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={rows.length === 0}
      title={`${rows.length}건 내보내기`}
      className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40 disabled:hover:bg-surface-container"
    >
      <Download className="h-3.5 w-3.5" />
      {label ?? "CSV 다운로드"}
    </button>
  );
}
