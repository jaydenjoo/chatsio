import { apiSuccess, apiError } from "@/lib/api";

// TODO: Task 1-6에서 실제 CRUD 구현
export function GET(): Response {
  return apiSuccess({ products: [], total: 0 });
}

export function POST(): Response {
  return apiError("NOT_IMPLEMENTED", "아직 구현되지 않은 기능입니다.", 501);
}
