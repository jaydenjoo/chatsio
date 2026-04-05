import { apiSuccess, ApiErrors } from "@/lib/api";

// TODO: Task 1-6에서 실제 CRUD 구현
export function GET(): Response {
  return apiSuccess({ products: [], total: 0 });
}

export function POST(): Response {
  return ApiErrors.unauthorized();
}
