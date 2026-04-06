"use client";

import type { ReactElement } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { SERVICE_NAV, SETTINGS_NAV } from "@/constants/nav";
import { ThemeToggle } from "@/components/layouts/theme-toggle";

/** NAV 상수에서 PAGE_META 자동 파생 */
const PAGE_META: Record<string, { group: string; title: string }> =
  [...SERVICE_NAV.map((item) => ({ ...item, group: "Service" })),
   ...SETTINGS_NAV.map((item) => ({ ...item, group: "Settings" })),
  ].reduce<Record<string, { group: string; title: string }>>(
    (acc, { href, label, group }) => {
      acc[href] = { group, title: label };
      return acc;
    },
    {},
  );

function getPageMeta(pathname: string): { group: string; title: string } {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  const match = Object.entries(PAGE_META).find(([key]) =>
    pathname.startsWith(`${key}/`),
  );
  return match ? match[1] : { group: "Home", title: "대시보드" };
}

interface HeaderProps {
  readonly onMobileMenuOpen: () => void;
}

export function Header({ onMobileMenuOpen }: HeaderProps): ReactElement {
  const pathname = usePathname();
  const { group, title } = getPageMeta(pathname);

  return (
    <header className="sticky top-0 w-full z-40 bg-[var(--surface-container-lowest)]/80 backdrop-blur-md">
      <div className="flex justify-between items-center px-4 md:px-6 h-16">
        {/* Left: Mobile menu + Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileMenuOpen}
            className="md:hidden p-2 -ml-2 hover:bg-[var(--surface-container)] rounded-lg text-[var(--on-surface-variant)] transition-colors"
            aria-label="메뉴 열기"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex flex-col">
            <nav className="flex items-center gap-1.5 text-[11px] text-[var(--outline)] font-bold uppercase tracking-widest mb-0.5">
              <span>{group}</span>
              <span className="text-[12px]">/</span>
              <span className="text-[var(--primary)]">{title}</span>
            </nav>
            <h2 className="text-xl font-black text-[var(--on-surface)] leading-none">
              {title}
            </h2>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[var(--surface-container-low)] p-1 rounded-full">
            <ThemeToggle />
            <button
              type="button"
              className="p-2 rounded-full text-[var(--outline)] hover:text-[var(--primary)] relative transition-colors"
              aria-label="알림"
            >
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--error)] rounded-full" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
