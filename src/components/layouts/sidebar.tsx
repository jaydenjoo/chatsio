"use client";

import type { ReactElement } from "react";
import { Sparkles } from "lucide-react";
import { SERVICE_NAV, SETTINGS_NAV } from "@/constants/nav";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarUserFooter } from "./sidebar-user-footer";

export function Sidebar(): ReactElement {
  return (
    <aside className="hidden md:flex w-[260px] h-screen fixed left-0 top-0 flex-col bg-[var(--surface-container-low)] z-30">
      <div className="flex flex-col h-full py-6 px-4">
        {/* Brand */}
        <div className="px-3 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--primary-container)] rounded-xl flex items-center justify-center">
            <Sparkles className="size-5 text-[var(--on-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--on-surface)] leading-none">
              Chatsio
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[var(--primary)] font-bold mt-1">
              AI Optimization
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-grow space-y-8">
          <div>
            <span className="px-4 text-[11px] font-bold text-[var(--outline)] uppercase tracking-wider mb-4 block">
              Service
            </span>
            <nav className="space-y-1">
              {SERVICE_NAV.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
            </nav>
          </div>

          <div>
            <span className="px-4 text-[11px] font-bold text-[var(--outline)] uppercase tracking-wider mb-4 block">
              Settings
            </span>
            <nav className="space-y-1">
              {SETTINGS_NAV.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
            </nav>
          </div>
        </div>

        {/* User Footer */}
        <SidebarUserFooter />
      </div>
    </aside>
  );
}
