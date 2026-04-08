import type { NextRequest } from "next/server";
import type { z } from "zod/v4";
import { ApiErrors } from "./response";

/**
 * Validation 실패 종류 — 호출자가 보안 민감 엔드포인트에서 generic 응답으로
 * 대체할 때 어떤 단계에서 실패했는지 log하기 위한 식별자.
 */
export type ValidationFailureKind = "json_parse" | "schema";

type ValidationResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      response: ReturnType<typeof ApiErrors.validationFailed>;
      kind: ValidationFailureKind;
      /** Zod 검증 실패 시에만 존재. json_parse 실패 시 undefined. */
      issues?: readonly z.core.$ZodIssue[];
    };

/**
 * 요청 body를 Zod 스키마로 검증.
 *
 * 기본 응답은 `ApiErrors.validationFailed` (422, details 포함). 보안 민감
 * 엔드포인트는 `validated.response`를 무시하고 자체 generic 응답을 리턴한
 * 뒤 `validated.issues`를 server log에만 남기면 된다 — 이 경우 details leak
 * 없이 헬퍼의 "JSON parse + Zod safeParse" 이점은 재사용 가능.
 */
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
      kind: "json_parse",
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      response: ApiErrors.validationFailed(result.error.issues),
      kind: "schema",
      issues: result.error.issues,
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
      kind: "schema",
      issues: result.error.issues,
    };
  }

  return { success: true, data: result.data };
}
