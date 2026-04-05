import { apiSuccess } from "@/lib/api";

export function GET(): Response {
  return apiSuccess({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
