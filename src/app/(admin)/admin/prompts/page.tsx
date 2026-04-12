import { MessageSquare } from "lucide-react";
import type { ReactElement } from "react";
import { PromptListClient } from "@/features/admin/components/prompt-list-client";
import { getPrompts } from "@/features/admin/actions/prompt-actions";

// ============================================================
// 상수
// ============================================================

const INDUSTRY_TABS = [
  { value: "", label: "전체" },
  { value: "clothing", label: "의류" },
  { value: "food", label: "식품" },
  { value: "furniture", label: "가구" },
  { value: "other", label: "기타" },
] as const;

// ============================================================
// 페이지
// ============================================================

export default async function AdminPromptsPage(props: {
  searchParams: Promise<{ industry?: string }>;
}): Promise<ReactElement> {
  const { industry } = await props.searchParams;

  const result = await getPrompts(industry);
  const rows = result.data ?? [];

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
            프롬프트 관리
          </h1>
          <p className="mt-1 text-on-surface-variant">
            업종별 AI 추출 프롬프트를 관리하고 버전을 추적합니다.
          </p>
        </div>
        <span className="rounded-full bg-[#006195]/10 px-3 py-1 text-sm font-bold text-[#006195]">
          {rows.length}개 프롬프트
        </span>
      </div>

      {/* 업종 탭 */}
      <div className="mb-6 flex gap-1 rounded-xl bg-surface-container p-1">
        {INDUSTRY_TABS.map((tab) => {
          const isActive = (industry ?? "") === tab.value;
          const href = tab.value
            ? `/admin/prompts?industry=${tab.value}`
            : "/admin/prompts";

          return (
            <a
              key={tab.value}
              href={href}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-surface-container-lowest text-on-surface shadow-[var(--shadow-sm)]"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label}
            </a>
          );
        })}
      </div>

      {/* 프롬프트 목록 */}
      {rows.length === 0 && !industry ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-lowest py-16 text-center">
          <MessageSquare className="mb-4 h-10 w-10 text-outline" />
          <h3 className="text-lg font-bold text-on-surface">
            등록된 프롬프트가 없습니다
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            아래 &quot;새 프롬프트 추가&quot; 버튼으로 첫 프롬프트를 만들어보세요.
          </p>
        </div>
      ) : null}

      <PromptListClient prompts={rows} />
    </div>
  );
}
