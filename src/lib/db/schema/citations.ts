import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { products } from "./products";
import { shops } from "./shops";

/**
 * Phase 5 PoC: 상품별 AI 생성 구매 의도 질문 세트.
 * 상품당 1세트만 존재 (UNIQUE product_id). 재생성 시 UPDATE.
 */
export const citationQuestions = pgTable(
  "citation_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    questions: jsonb("questions").notNull(),
    generatedBy: text("generated_by")
      .notNull()
      .default("claude-haiku-4-5-20251001"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("citation_questions_product_unique").on(table.productId),
  ],
);

/**
 * Phase 5 PoC: ChatGPT 질의 결과. 질문 1개 = 1행.
 * run_id로 같은 실행의 질문들을 그룹핑. Immutable (UPDATE 없음).
 */
export const citationTracking = pgTable(
  "citation_tracking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    runId: uuid("run_id").notNull(),
    questionText: text("question_text").notNull(),
    aiResponse: text("ai_response").notNull(),
    isCited: boolean("is_cited").notNull().default(false),
    matchedName: boolean("matched_name").notNull().default(false),
    matchedUrl: boolean("matched_url").notNull().default(false),
    citationScore: integer("citation_score").notNull().default(0),
    model: text("model").notNull().default("gpt-4o-mini"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("citation_tracking_product_created_idx").on(table.productId, table.createdAt),
    index("citation_tracking_run_idx").on(table.runId),
    index("citation_tracking_shop_created_idx").on(table.shopId, table.createdAt),
  ],
);
