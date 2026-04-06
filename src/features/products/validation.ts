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

// ============================================================
// 이미지 업로드 상한
// ============================================================
//
// 이 값은 `product-images` 버킷 설정과 일치해야 한다.
// (마이그레이션 `product_images_storage_rls_and_config` 참조)
// 버킷 레벨 제한이 최종 방어선이지만, 클라/서버 양쪽에서 선검증하여
// 사용자에게 빠른 피드백을 주고 네트워크 비용을 줄인다.

export const IMAGE_MAX_FILES = 5;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB per file
export const IMAGE_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ImageMime = (typeof IMAGE_ALLOWED_MIME)[number];

export function isAllowedImageMime(mime: string): mime is ImageMime {
  return (IMAGE_ALLOWED_MIME as readonly string[]).includes(mime);
}

// ============================================================
// Magic bytes 검증 — MIME spoofing 방어
// ============================================================
//
// `File.type`은 브라우저가 확장자/OS MIME 레지스트리에서 추론한 값이라
// 사용자가 `exploit.html`을 `exploit.jpg`로 이름만 바꾸면 서버는
// `image/jpeg`로 받는다. 버킷 레벨 MIME 체크도 Content-Type 헤더에
// 의존하므로 같은 방식으로 우회 가능.
//
// 파일의 첫 12바이트를 읽어 실제 magic number와 비교해 반환한다.
// 매칭되지 않으면 null — 서버 액션에서 거부해야 함.
//
// 참고:
//   - JPEG: FF D8 FF
//   - PNG:  89 50 4E 47 0D 0A 1A 0A
//   - WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50 ("RIFF...WEBP")
export async function sniffImageMime(file: File): Promise<ImageMime | null> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (head.length < 4) return null;

  // JPEG
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG
  if (
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47
  ) {
    return "image/png";
  }

  // WebP — "RIFF"(4) + size(4) + "WEBP"(4)
  if (
    head.length >= 12 &&
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

// ============================================================
// 파일명 정규화 — Storage 경로 주입 방어
// ============================================================
//
// 사용자 업로드 파일명을 Storage 오브젝트 key의 일부로 쓸 때는 반드시
// 다음을 제거해야 한다:
//   - 경로 구분자 `/` `\` (상위 디렉토리 우회)
//   - Windows 예약 문자 `:` `*` `?` `"` `<` `>` `|`
//   - NUL 바이트 + 제어 문자 (0x00-0x1F)
//   - NFKC 정규화 (full-width → ASCII)
// base/ext 분리 후 각각 sanitize → 최종 길이 제한.
// 완전히 비어버리면 `"file"`로 대체.

export function sanitizeFilename(name: string): string {
  const normalized = name.normalize("NFKC");
  const lastDot = normalized.lastIndexOf(".");
  const rawBase = lastDot > 0 ? normalized.slice(0, lastDot) : normalized;
  const rawExt = lastDot > 0 ? normalized.slice(lastDot + 1) : "";

  const CONTROL_OR_PATH_RE = /[/\\:*?"<>|\x00-\x1f]/g;

  const safeBase = rawBase
    .replace(CONTROL_OR_PATH_RE, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "") // leading/trailing dot/dash 제거
    .slice(0, 80);

  const safeExt = rawExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);

  if (!safeBase && !safeExt) return "file";
  if (!safeBase) return `file.${safeExt}`;
  if (!safeExt) return safeBase;
  return `${safeBase}.${safeExt}`;
}
