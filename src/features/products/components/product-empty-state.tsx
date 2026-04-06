import type { ReactElement } from "react";
import { EmptyState } from "@/components/shared";

export function ProductEmptyState(): ReactElement {
  return (
    <EmptyState
      title="아직 등록된 상품이 없습니다"
      description="상품을 추가하면 AI가 자동으로 구조화된 데이터를 생성합니다."
      action={{
        label: "상품 추가",
        href: "/products/new",
      }}
    />
  );
}
