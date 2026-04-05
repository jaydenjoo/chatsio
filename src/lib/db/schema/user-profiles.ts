import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(), // auth.users.id와 동일
  role: userRoleEnum("role").notNull().default("member"),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
