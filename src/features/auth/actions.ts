"use server";

import { z } from "zod/v4";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/monitoring/log-event";
import type { AuthError } from "@supabase/supabase-js";

// ============================================================
// Zod 스키마
// ============================================================

const signUpSchema = z.object({
  email: z.email("올바른 이메일 형식을 입력하세요."),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
  fullName: z.string().max(100).optional(),
});

const signInSchema = z.object({
  email: z.email("올바른 이메일 형식을 입력하세요."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

// ============================================================
// 에러 매핑
// ============================================================

function toSafeAuthError(error: AuthError): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
    "User already registered": "이미 사용 중인 이메일입니다.",
    "Email not confirmed": "이메일 인증이 필요합니다. 받은편지함을 확인해주세요.",
    "Too many requests": "잠시 후 다시 시도해주세요.",
    "Signup requires a valid password": "유효한 비밀번호를 입력해주세요.",
  };
  return map[error.message] ?? "오류가 발생했습니다. 다시 시도해주세요.";
}

// ============================================================
// Types
// ============================================================

interface AuthResult {
  error: string | null;
}

// ============================================================
// Server Actions
// ============================================================

export async function signUp(formData: FormData): Promise<AuthResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName") || undefined,
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName ?? undefined,
      },
    },
  });

  if (error) {
    // ⚠️ PII 금지: email/이름/비밀번호는 로그에 찍지 않는다. Supabase AuthError
    // message는 "User already registered" 같은 일반 문구라 PII 아님.
    void logEvent({
      service: "next-app",
      level: "warn",
      step: "signup_auth_error",
      contextType: "auth",
      message: `signUp AuthError: ${error.message}`,
    });
    return { error: toSafeAuthError(error) };
  }

  return { error: null };
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // 브루트포스/credential stuffing 관측용. email은 기록 안 함 — 공격자가
    // 여러 email을 시도할 때 개별 attempt를 추적하고 싶다면 별도 보안 인프라
    // (예: Supabase Auth 자체 rate limit)가 담당. 여기서는 총 실패량만 집계.
    void logEvent({
      service: "next-app",
      level: "warn",
      step: "signin_auth_error",
      contextType: "auth",
      message: `signIn AuthError: ${error.message}`,
    });
    return { error: toSafeAuthError(error) };
  }

  // 감사 로그 (audit trail) — 성공한 로그인만 기록. 누가 언제 로그인했는지
  // 🔴 프로젝트 감사 요구사항. userId(uuid)만 기록, PII 아님.
  // signInWithPassword 반환값에서 user를 직접 사용 — 불필요한 getUser() 호출 방지.
  if (signInData.user) {
    void logEvent({
      service: "next-app",
      level: "info",
      step: "signin_success",
      contextType: "auth",
      message: "signIn 성공",
      userId: signInData.user.id,
    });
  }

  redirect("/products");
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    headerStore.get("x-forwarded-host") ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (!origin) {
    redirect("/login?error=missing_origin");
  }

  const normalizedOrigin = origin.startsWith("http") ? origin : `https://${origin}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${normalizedOrigin}/auth/callback`,
    },
  });

  if (error) {
    void logEvent({
      service: "next-app",
      level: "warn",
      step: "google_auth_error",
      contextType: "auth",
      message: `signInWithOAuth(google) 실패: ${error.message}`,
    });
    redirect("/login?error=google_auth_failed");
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
