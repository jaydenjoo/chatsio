"use client";

import type { ReactElement, ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  readonly children: ReactNode;
}

/**
 * next-themes 래퍼.
 * - attribute="class": <html>에 .dark 클래스 토글 → globals.css의 .dark 토큰 블록 활성
 * - defaultTheme="system": OS 설정 추적
 * - disableTransitionOnChange: 토글 시 색상 트랜지션 깜빡임 방지
 */
export function ThemeProvider({ children }: ThemeProviderProps): ReactElement {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
