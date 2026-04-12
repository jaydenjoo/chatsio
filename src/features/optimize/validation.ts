/**
 * 최적화 실행 검증 유틸 — 서버/클라이언트 공유.
 *
 * Server Action에서 쓰는 Zod 스키마 + 클라이언트에서 폼 검증에 쓸 상수들.
 * `"use server"` 파일 외부에 두어 양쪽에서 import 가능 (learnings.md 참고).
 */

import { z } from "zod/v4";

export const OPTIMIZATION_PLANS = ["basic", "premium"] as const;
export type OptimizationPlan = (typeof OPTIMIZATION_PLANS)[number];

export const PLAN_ESTIMATED_SECONDS: Record<OptimizationPlan, number> = {
  basic: 35,
  premium: 155,
};

export const PLAN_LABEL: Record<OptimizationPlan, string> = {
  basic: "Basic",
  premium: "Premium",
};

export const runOptimizationSchema = z.object({
  productId: z.string().uuid("올바른 상품 ID가 아닙니다"),
  plan: z.enum(OPTIMIZATION_PLANS),
});

export type RunOptimizationInput = z.infer<typeof runOptimizationSchema>;

export const updateResultSchema = z.object({
  optimizationId: z.string().uuid("올바른 최적화 ID가 아닙니다"),
  resultJson: z.record(z.string(), z.unknown()),
});

/**
 * 5분 윈도우 — 같은 (product, plan) 조합에 대해 진행 중인 최적화가
 * 있으면 새 실행을 차단하고 기존 결과로 안내.
 *
 * Stripe 24h는 결제 idempotency용이라 너무 김. AI 최적화는 32~155초라
 * 5분이면 안전하게 포함 + 재실행 케이스도 막지 않음.
 */
export const DUPLICATE_CHECK_WINDOW_MS = 5 * 60 * 1000;

/** 진행 단계별 사용자 라벨 — Realtime에서 processing_step 매핑 */
export const PROCESSING_STEP_LABELS: Record<number, string> = {
  1: "상품 데이터 정규화",
  2: "AI 최적화 처리",
  3: "결과 품질 검수",
  4: "결과 저장",
};
