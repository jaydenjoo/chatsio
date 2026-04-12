"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { requireAdmin } from "@/features/admin/lib/require-admin";

// ============================================================
// 타입
// ============================================================

const INDUSTRIES = ["clothing", "food", "furniture", "other"] as const;
type Industry = (typeof INDUSTRIES)[number];

export interface PromptRow {
  readonly id: string;
  readonly industry: Industry;
  readonly name: string;
  readonly content: string;
  readonly version: number;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PromptVersionRow {
  readonly id: string;
  readonly prompt_id: string;
  readonly version: number;
  readonly content: string;
  readonly created_at: string;
}

export interface ActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

// ============================================================
// Zod 스키마
// ============================================================

const createPromptSchema = z.object({
  industry: z.enum(INDUSTRIES),
  name: z.string().min(1, "프롬프트 이름을 입력해주세요").max(200),
  content: z.string().min(1, "프롬프트 내용을 입력해주세요").max(50_000, "프롬프트가 너무 깁니다 (최대 50,000자)"),
});

const savePromptSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1, "프롬프트 내용을 입력해주세요").max(50_000, "프롬프트가 너무 깁니다 (최대 50,000자)"),
});

const getVersionsSchema = z.object({
  promptId: z.string().uuid(),
});

const rollbackSchema = z.object({
  promptId: z.string().uuid(),
  versionId: z.string().uuid(),
});

// ============================================================
// Server Actions
// ============================================================

/** 프롬프트 목록 조회 (업종 필터 선택) */
export async function getPrompts(
  industry?: string,
): Promise<ActionResult<readonly PromptRow[]>> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  let query = auth.ctx.supabase
    .from("prompts")
    .select("id, industry, name, content, version, is_active, created_at, updated_at")
    .eq("is_active", true)
    .order("industry")
    .order("name");

  if (industry && INDUSTRIES.includes(industry as Industry)) {
    query = query.eq("industry", industry);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: "프롬프트 목록을 불러올 수 없습니다." };
  }

  return { success: true, data: (data ?? []) as unknown as PromptRow[] };
}

/** 특정 프롬프트의 버전 히스토리 조회 */
export async function getPromptVersions(
  input: unknown,
): Promise<ActionResult<readonly PromptVersionRow[]>> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  const parsed = getVersionsSchema.safeParse(typeof input === "string" ? { promptId: input } : input);
  if (!parsed.success) {
    return { success: false, error: "유효하지 않은 프롬프트 ID입니다." };
  }

  const { data, error } = await auth.ctx.supabase
    .from("prompt_versions")
    .select("id, prompt_id, version, content, created_at")
    .eq("prompt_id", parsed.data.promptId)
    .order("version", { ascending: false });

  if (error) {
    return { success: false, error: "버전 히스토리를 불러올 수 없습니다." };
  }

  return { success: true, data: (data ?? []) as unknown as PromptVersionRow[] };
}

/** 새 프롬프트 생성 */
export async function createPrompt(
  input: unknown,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  const parsed = createPromptSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "입력값이 올바르지 않습니다." };
  }

  const { industry, name, content } = parsed.data;

  const { error } = await auth.ctx.supabase.from("prompts").insert({
    industry,
    name,
    content,
    version: 1,
    is_active: true,
    created_by: auth.ctx.userId,
  });

  if (error) {
    return { success: false, error: "프롬프트 생성에 실패했습니다." };
  }

  revalidatePath("/admin/prompts");
  return { success: true };
}

/** 프롬프트 내용 저장 — 자동으로 버전 기록 */
export async function savePrompt(
  input: unknown,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  const parsed = savePromptSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "입력값이 올바르지 않습니다." };
  }

  const { id, content } = parsed.data;

  // 1) 현재 프롬프트 조회
  const { data: current, error: fetchError } = await auth.ctx.supabase
    .from("prompts")
    .select("version, content")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !current) {
    return { success: false, error: "프롬프트를 찾을 수 없습니다." };
  }

  // 변경 없으면 저장 안 함
  if (current.content === content) {
    return { success: true };
  }

  const nextVersion = current.version + 1;

  // 2) 현재 내용을 버전 히스토리에 저장
  const { error: versionError } = await auth.ctx.supabase
    .from("prompt_versions")
    .insert({
      prompt_id: id,
      version: current.version,
      content: current.content,
      created_by: auth.ctx.userId,
    });

  if (versionError) {
    return { success: false, error: "버전 기록에 실패했습니다." };
  }

  // 3) 프롬프트 업데이트
  const { error: updateError } = await auth.ctx.supabase
    .from("prompts")
    .update({ content, version: nextVersion })
    .eq("id", id);

  if (updateError) {
    return { success: false, error: "프롬프트 저장에 실패했습니다." };
  }

  revalidatePath("/admin/prompts");
  return { success: true };
}

/** 특정 버전으로 롤백 — 새 버전으로 기록 */
export async function rollbackPrompt(
  input: unknown,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.success || !auth.ctx) {
    return { success: false, error: auth.error };
  }

  const parsed = rollbackSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "입력값이 올바르지 않습니다." };
  }

  const { promptId, versionId } = parsed.data;

  // 1) 현재 프롬프트 조회
  const { data: current, error: currentError } = await auth.ctx.supabase
    .from("prompts")
    .select("version, content")
    .eq("id", promptId)
    .maybeSingle();

  if (currentError || !current) {
    return { success: false, error: "프롬프트를 찾을 수 없습니다." };
  }

  // 2) 롤백 대상 버전 조회
  const { data: target, error: targetError } = await auth.ctx.supabase
    .from("prompt_versions")
    .select("content, version")
    .eq("id", versionId)
    .eq("prompt_id", promptId)
    .maybeSingle();

  if (targetError || !target) {
    return { success: false, error: "해당 버전을 찾을 수 없습니다." };
  }

  const nextVersion = current.version + 1;

  // 3) 현재 내용을 버전 히스토리에 저장
  const { error: versionError } = await auth.ctx.supabase
    .from("prompt_versions")
    .insert({
      prompt_id: promptId,
      version: current.version,
      content: current.content,
      created_by: auth.ctx.userId,
    });

  if (versionError) {
    return { success: false, error: "버전 기록에 실패했습니다." };
  }

  // 4) 롤백 대상 내용으로 업데이트
  const { error: updateError } = await auth.ctx.supabase
    .from("prompts")
    .update({ content: target.content, version: nextVersion })
    .eq("id", promptId);

  if (updateError) {
    return { success: false, error: "롤백에 실패했습니다." };
  }

  revalidatePath("/admin/prompts");
  return { success: true };
}
