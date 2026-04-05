import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { shops } from "./shops";
import { productStatusEnum, productSourceEnum } from "./enums";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url"),
  imageUrls: text("image_urls").array(),
  status: productStatusEnum("status").notNull().default("pending"),
  source: productSourceEnum("source").notNull().default("url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
