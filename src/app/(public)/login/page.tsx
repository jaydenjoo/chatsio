"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { signIn, signInWithGoogle } from "@/features/auth";

export default function LoginPage(): React.ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData): Promise<void> {
    setError(null);
    setLoading(true);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {/* 탭 네비게이션 */}
      <div className="mb-8 flex gap-6">
        <span className="border-b-2 border-primary pb-2 text-sm font-semibold text-on-surface">
          로그인
        </span>
        <Link
          href="/signup"
          className="pb-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
        >
          회원가입
        </Link>
      </div>

      {/* 로그인 폼 */}
      <form action={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="example@chatsio.kr"
            required
            autoComplete="email"
            className="h-11 bg-surface-container-highest/50 transition-all focus:bg-surface-container-lowest"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">비밀번호</Label>
            <span className="text-xs text-on-surface-variant">
              비밀번호를 잊으셨나요?
            </span>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            required
            autoComplete="current-password"
            minLength={6}
            className="h-11 bg-surface-container-highest/50 transition-all focus:bg-surface-container-lowest"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-error-container/50 px-3 py-2 text-sm text-on-error-container">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-md transition-all hover:shadow-lg"
        >
          {loading ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      {/* 구분선 */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-outline-variant/40" />
        <span className="text-xs text-on-surface-variant">또는</span>
        <div className="h-px flex-1 bg-outline-variant/40" />
      </div>

      {/* 구글 로그인 */}
      <form action={signInWithGoogle}>
        <Button
          type="submit"
          variant="outline"
          className="h-11 w-full gap-2"
        >
        <svg className="size-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google로 계속하기
        </Button>
      </form>

      {/* 모바일 회원가입 링크 */}
      <p className="mt-6 text-center text-sm text-on-surface-variant lg:hidden">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          회원가입
        </Link>
      </p>
    </AuthLayout>
  );
}
