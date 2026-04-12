import { PageHeader } from "@/components/shared";
import { getSettings } from "@/features/settings";
import { SettingsForm } from "@/features/settings/components/settings-form";

export default async function SettingsPage(): Promise<React.ReactElement> {
  const result = await getSettings();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-8">
        <PageHeader title="설정" description="프로필 및 쇼핑몰 정보를 관리합니다." />
        <div className="rounded-2xl border border-[var(--error)]/40 bg-[var(--error)]/5 p-6 text-sm text-[var(--error)]">
          {result.error ?? "설정을 불러오지 못했습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="설정"
        description="프로필 및 쇼핑몰 정보를 관리합니다."
      />
      <SettingsForm data={result.data} />
    </div>
  );
}
