import { ApiErrors } from "@/lib/api";

// TODO: Task 4-6에서 프롬프트 CRUD 구현
export function GET(): Response {
  return ApiErrors.forbidden();
}

export function POST(): Response {
  return ApiErrors.forbidden();
}
