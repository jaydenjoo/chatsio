"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Target,
  Users,
} from "lucide-react";
import type { ReactElement } from "react";
import { Logo } from "@/components/brand/logo";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: readonly NavItem[];
}

const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "서비스",
    items: [
      { href: "/admin", label: "어드민 홈", icon: LayoutDashboard },
      { href: "/admin/customers", label: "고객 관리", icon: Users },
      { href: "/admin/optimizations", label: "최적화 모니터링", icon: Activity },
      { href: "/admin/events", label: "이벤트 로그", icon: ScrollText },
    ],
  },
  {
    label: "관리",
    items: [
      { href: "/admin/prompts", label: "프롬프트 관리", icon: MessageSquare },
      { href: "/admin/costs", label: "AI 비용", icon: CreditCard },
      { href: "/admin/citations", label: "AI 인용 추적", icon: Target },
    ],
  },
];

export function AdminSidebar(): ReactElement {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col bg-surface-container-low lg:flex">
      <div className="flex h-full flex-col px-4 py-6">
        {/* 브랜드 */}
        <div className="mb-10 flex items-center gap-3 px-3">
          <Logo size={40} />
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-on-surface">
              Chatsio
            </span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#006195]">
              Admin
            </p>
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="flex-grow space-y-8">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <span className="mb-4 block px-4 text-[11px] font-bold uppercase tracking-wider text-outline">
                {group.label}
              </span>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                        active
                          ? "border-r-4 border-[#006195] bg-[#006195]/[0.06] font-bold text-[#006195]"
                          : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-[#006195]"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
