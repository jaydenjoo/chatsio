import { PageHeader } from "@/components/shared";
import { getDeployData } from "@/features/optimize/actions";
import { DeployJsonLd } from "@/features/optimize/components/deploy-jsonld";
import { DeployLoader } from "@/features/optimize/components/deploy-loader";
import { LlmsTxtPreview } from "@/features/optimize/components/llms-txt-preview";

export default async function DeployPage(): Promise<React.ReactElement> {
  const result = await getDeployData();

  return (
    <div className="space-y-8">
      <PageHeader
        title="배포 관리"
        description="JSON-LD 코드와 llms.txt를 쇼핑몰에 적용합니다."
      />

      {/* 1. JSON-LD 코드 복사 */}
      <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] sm:p-8">
        <DeployJsonLd products={result.success ? result.products : []} />
      </div>

      {/* 2. Loader JS (자동 적용) */}
      <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] sm:p-8">
        <DeployLoader shopId={result.shopId} />
      </div>

      {/* 3. llms.txt */}
      <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] sm:p-8">
        <LlmsTxtPreview />
      </div>
    </div>
  );
}
