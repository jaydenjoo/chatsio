import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "member"]);

export const shopPlatformEnum = pgEnum("shop_platform", [
  "cafe24",
  "imweb",
  "godomall",
  "other",
]);

export const industryEnum = pgEnum("industry", [
  "clothing",
  "food",
  "furniture",
  "other",
]);

export const productStatusEnum = pgEnum("product_status", [
  "pending",
  "optimized",
  "failed",
  "manual_review",
]);

export const productSourceEnum = pgEnum("product_source", [
  "url",
  "csv",
  "cafe24_api",
]);

export const optimizationPlanEnum = pgEnum("optimization_plan", [
  "basic",
  "premium",
]);

export const optimizationStatusEnum = pgEnum("optimization_status", [
  "queued",
  "processing",
  "completed",
  "failed",
]);
