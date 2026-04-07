import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { products } from "./products";
import { shops } from "./shops";
import { optimizationPlanEnum, optimizationStatusEnum } from "./enums";

export const optimizations = pgTable(
  "optimizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    plan: optimizationPlanEnum("plan").notNull().default("basic"),
    status: optimizationStatusEnum("status").notNull().default("queued"),
    idempotencyKey: text("idempotency_key").notNull(),
    resultJson: jsonb("result_json"),
    jsonld: jsonb("jsonld"),
    score: integer("score"),
    errorMessage: text("error_message"),
    // 진행 단계 (1~4). null = 시작 전 or 종료. 마이그레이션 004.
    processingStep: integer("processing_step"),
    // 실패 단계명 (text). 'normalize' | 'claude_call' | 'json_parse' | ...
    errorStep: text("error_step"),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    retryCount: integer("retry_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("optimizations_idempotency_unique").on(table.idempotencyKey),
  ]
);
