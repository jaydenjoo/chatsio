"use client";

import type { ReactElement } from "react";
import { Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SERVICE_NAV, SETTINGS_NAV } from "@/constants/nav";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarUserFooter } from "./sidebar-user-footer";

interface MobileSidebarProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({
  open,
  onOpenChange,
}: MobileSidebarProps): ReactElement {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[280px] p-0 bg-[var(--surface-container-low)] flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary-container)] rounded-xl flex items-center justify-center">
              <Sparkles className="size-5 text-[var(--on-primary)]" />
            </div>
            <SheetTitle className="text-2xl font-bold tracking-tight text-[var(--on-surface)] leading-none">
              Chatsio
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex flex-col flex-1 overflow-y-auto px-4 pt-8">
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
          <div className="pb-6">
            <SidebarUserFooter />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
