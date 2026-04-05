"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { signUp, signInWithGoogle } from "@/features/auth";

export default function SignupPage(): React.ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData): Promise<void> {
    setError(null);
    setLoading(true);
    const result = await signUp(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-secondary-fixed">
            <svg className="size-6 text-on-secondary-fixed-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-section text-on-surface">이메일을 확인해주세요</h2>
          <p className="text-sm text-on-surface-variant">
            입력하신 이메일로 인증 링크를 보냈습니다.
            <br />
            링크를 클릭하면 가입이 완료됩니다.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* 탭 네비게이션 */}
      <div className="mb-8 flex gap-6">
        <Link
          href="/login"
          className="pb-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
        >
          로그인
        </Link>
        <span className="border-b-2 border-primary pb-2 text-sm font-semibold text-on-surface">
          회원가입
        </span>
      </div>

      {/* 회원가입 폼 */}
      <form action={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName">이름</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="홍길동"
            autoComplete="name"
            className="h-11 bg-surface-container-highest/50 transition-all focus:bg-surface-container-lowest"
          />
        </div>

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
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="6자 이상 입력하세요"
            required
            autoComplete="new-password"
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
          {loading ? "가입 중..." : "회원가입"}
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

      {/* 모바일 로그인 링크 */}
      <p className="mt-6 text-center text-sm text-on-surface-variant lg:hidden">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          로그인
        </Link>
      </p>
    </AuthLayout>
  );
}
