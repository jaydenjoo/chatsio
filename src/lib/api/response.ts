import { NextResponse } from "next/server";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

/** 성공 응답 */
export function apiSuccess<T>(
  data: T,
  pagination?: PaginationMeta,
  status = 200
): NextResponse {
  return NextResponse.json(
    pagination ? { data, pagination } : { data },
    { status }
  );
}

/** 에러 응답 */
export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse {
  const error: ApiErrorDetail = { code, message };
  if (details !== undefined) {
    error.details = details;
  }
  return NextResponse.json({ error }, { status });
}

/** 자주 쓰는 에러 단축 */
export const ApiErrors = {
  unauthorized(): NextResponse {
    return apiError("UNAUTHORIZED", "인증이 필요합니다.", 401);
  },
  forbidden(): NextResponse {
    return apiError("FORBIDDEN", "접근 권한이 없습니다.", 403);
  },
  notFound(resource = "리소스"): NextResponse {
    return apiError("NOT_FOUND", `${resource}을(를) 찾을 수 없습니다.`, 404);
  },
  validationFailed(details: unknown): NextResponse {
    return apiError("VALIDATION_FAILED", "입력값이 올바르지 않습니다.", 422, details);
  },
  internal(): NextResponse {
    return apiError("INTERNAL_ERROR", "서버 오류가 발생했습니다.", 500);
  },
} as const;
