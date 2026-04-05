import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  userProfiles,
  shops,
  products,
  optimizations,
  prompts,
  promptVersions,
} from "@/lib/db/schema";

// Select 타입 (DB에서 읽을 때)
export type UserProfile = InferSelectModel<typeof userProfiles>;
export type Shop = InferSelectModel<typeof shops>;
export type Product = InferSelectModel<typeof products>;
export type Optimization = InferSelectModel<typeof optimizations>;
export type Prompt = InferSelectModel<typeof prompts>;
export type PromptVersion = InferSelectModel<typeof promptVersions>;

// Insert 타입 (DB에 쓸 때)
export type NewUserProfile = InferInsertModel<typeof userProfiles>;
export type NewShop = InferInsertModel<typeof shops>;
export type NewProduct = InferInsertModel<typeof products>;
export type NewOptimization = InferInsertModel<typeof optimizations>;
export type NewPrompt = InferInsertModel<typeof prompts>;
export type NewPromptVersion = InferInsertModel<typeof promptVersions>;
