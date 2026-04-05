import { ApiErrors } from "@/lib/api";

// TODO: Task 2-4에서 n8n 웹훅 호출 구현
export function POST(): Response {
  return ApiErrors.unauthorized();
}
