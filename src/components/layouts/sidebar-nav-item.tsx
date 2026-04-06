"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
}: SidebarNavItemProps): ReactElement {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? "text-[var(--primary)] font-bold bg-[var(--primary-fixed)]/20"
          : "text-[var(--on-surface-variant)] hover:text-[var(--primary)] hover:bg-[var(--surface-container)]/50"
      }`}
    >
      <Icon className="size-5 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
