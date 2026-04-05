import type { NextRequest } from "next/server";
import type { z } from "zod/v4";
import { ApiErrors } from "./response";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: ReturnType<typeof ApiErrors.validationFailed> };

/** 요청 body를 Zod 스키마로 검증 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: ApiErrors.validationFailed("요청 본문이 유효한 JSON이 아닙니다."),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      response: ApiErrors.validationFailed(result.error.issues),
    };
  }

  return { success: true, data: result.data };
}

/** URL 쿼리 파라미터를 Zod 스키마로 검증 */
export function validateQuery<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): ValidationResult<z.infer<T>> {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      success: false,
      response: ApiErrors.validationFailed(result.error.issues),
    };
  }

  return { success: true, data: result.data };
}
