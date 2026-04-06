"use client";

import type { ReactElement } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * 다크모드 토글 버튼.
 *
 * Hydration mismatch 방지:
 * next-themes가 하이드레이션 전에 `<html>`에 .dark 클래스를 붙이므로
 * 아이콘 스왑은 Tailwind dark: variant로 CSS-only 처리한다.
 * (mounted flag + setState-in-effect 패턴은 React 19 린터 위반)
 *
 * useTheme()는 서버/클라이언트 첫 렌더 모두 undefined를 반환하므로
 * aria-pressed도 양쪽 모두 "false"로 렌더되어 hydration mismatch가 없다.
 * 이후 next-themes가 실제 값을 주입하면 자연스럽게 업데이트된다.
 */
export function ThemeToggle(): ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const handleToggle = (): void => {
    // 하이드레이션 직후 resolvedTheme이 undefined인 짧은 창 동안 클릭을 무시 —
    // OS 선호와 반대 방향으로 토글되는 것을 방지한다.
    if (!resolvedTheme) return;
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isDark}
      aria-label="다크 모드 토글"
      className="p-2 rounded-full text-[var(--outline)] hover:text-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-container-low)]"
    >
      <Moon className="size-4 dark:hidden" aria-hidden="true" />
      <Sun className="size-4 hidden dark:block" aria-hidden="true" />
    </button>
  );
}
