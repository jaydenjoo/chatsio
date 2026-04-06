/**
 * 상품 등록 공유 검증 유틸 — 서버/클라이언트 양쪽에서 사용.
 *
 * 주의: 이 파일은 `"use server"`가 없으므로 클라이언트 컴포넌트에서
 * 동기 import/호출 가능. actions.ts(Server Actions)에서도 import하여
 * 같은 규칙을 한 곳에서 유지한다.
 */

// ============================================================
// 벌크 등록 상한 (CSV)
// ============================================================

export const BULK_MAX_ROWS = 100;
export const BULK_MAX_NAME = 200;
export const BULK_MAX_URL = 2048;

// ============================================================
// Excel formula injection 방어
// ============================================================

// `=` `+` `-` `@` `\t` `\r`로 시작하는 셀은 Excel에서 수식으로 실행될 수 있음.
//
// 유니코드 우회 방어:
//   1. NFKC 정규화 → full-width(`＝` U+FF1D, `＋` U+FF0B 등)를 ASCII로 변환
//   2. leading whitespace 제거 → NBSP(U+00A0), ZWNBSP/BOM(U+FEFF) 포함
//
// 참고: OWASP "CSV Injection (Formula Injection)"
const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/;

export function hasFormulaInjection(input: string): boolean {
  const normalized = input.normalize("NFKC").replace(/^[\s\u00A0\uFEFF]+/, "");
  return FORMULA_PREFIX_RE.test(normalized);
}
