import { pgTable, uuid, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { userProfiles } from "./user-profiles";
import { shopPlatformEnum, industryEnum } from "./enums";

export const shops = pgTable(
  "shops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    platform: shopPlatformEnum("platform").notNull().default("cafe24"),
    industry: industryEnum("industry").notNull().default("clothing"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("shops_url_unique").on(table.url)]
);
