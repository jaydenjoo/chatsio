import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductCreateForm } from "@/features/products/components/product-create-form";

export const metadata: Metadata = {
  title: "새 상품 등록 | Chatsio",
  description: "상품 URL을 입력하고 AI 최적화를 실행하세요",
};

/**
 * 새 상품 등록 페이지.
 *
 * 인증/온보딩/shop 검증은 상위 `(dashboard)/layout.tsx`에서 매 요청마다
 * 수행된다. 이 페이지가 렌더된다는 것은 이미 다음이 보장된 상태:
 *   - 인증된 사용자
 *   - `user_profiles.onboarding_completed = true`
 *   - `shops` row 존재 (user_id 매칭)
 *
 * 따라서 페이지는 UI만 렌더한다. layout이 실패하면 redirect()로 이 함수는
 * 아예 실행되지 않는다 — Next.js App Router의 layout→page 렌더 순서 불변식.
 *
 * 주의: Server Action(createProduct / createProductWithImages /
 * createProductsBulk)은 브라우저에서 직접 호출 가능하므로 각자 스스로
 * 인증/소유권을 재검증한다. 이 레이어 분리는 의도된 것 — layout 방어를
 * Server Action에서 신뢰하지 말 것.
 */
export default function NewProductPage(): React.ReactElement {
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
