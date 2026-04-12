"use client";

import { useState } from "react";
import { PromptCard, CreatePromptCard } from "./prompt-card";
import { PromptVersionPanel } from "./prompt-version-panel";
import type { PromptRow } from "@/features/admin/actions/prompt-actions";
import { useRouter } from "next/navigation";

interface PromptListClientProps {
  readonly prompts: readonly PromptRow[];
}

export function PromptListClient({
  prompts,
}: PromptListClientProps): React.ReactElement {
  const [historyOpenId, setHistoryOpenId] = useState<string | null>(null);
  const router = useRouter();

  function handleToggleHistory(promptId: string): void {
    setHistoryOpenId((prev) => (prev === promptId ? null : promptId));
  }

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => (
        <div key={prompt.id}>
          <PromptCard
            prompt={prompt}
            onToggleHistory={handleToggleHistory}
            isHistoryOpen={historyOpenId === prompt.id}
          />
          {historyOpenId === prompt.id && (
            <div className="mt-2 ml-4">
              <PromptVersionPanel promptId={prompt.id} />
            </div>
          )}
        </div>
      ))}

      <CreatePromptCard onCreated={() => router.refresh()} />
    </div>
  );
}
