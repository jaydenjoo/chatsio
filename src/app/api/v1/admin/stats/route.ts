import { ApiErrors } from "@/lib/api";

// TODO: Task 4-3에서 KPI 데이터 구현
export function GET(): Response {
  return ApiErrors.forbidden();
}
