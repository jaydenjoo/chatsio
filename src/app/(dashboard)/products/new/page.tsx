import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductCreateForm } from "@/features/products/components/product-create-form";

export const metadata: Metadata = {
  title: "새 상품 등록 | Chatsio",
  description: "상품 URL을 입력하고 AI 최적화를 실행하세요",
};

export default async function NewProductPage(): Promise<React.ReactElement> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 쇼핑몰 정보 확인 (온보딩 완료 여부)
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shop) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto w-full max-w-[720px] space-y-8">
      {/* 뒤로가기 */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--outline)] transition-colors hover:text-[var(--on-surface)]"
      >
        <ArrowLeft className="size-4" />
        상품 목록으로
      </Link>

      {/* 헤더 */}
      <div className="space-y-2">
        <h1
          className="font-display text-3xl font-bold tracking-tight text-[var(--on-surface)]"
          style={{ letterSpacing: "-0.02em" }}
        >
          새 상품 등록
        </h1>
        <p className="text-[var(--on-surface-variant)]">
          상품 URL을 입력하면 AI가 이미지와 설명을 자동으로 수집합니다.
        </p>
      </div>

      {/* 폼 */}
      <ProductCreateForm />
    </div>
  );
}
