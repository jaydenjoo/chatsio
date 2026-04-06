"use client";

import type { ReactElement } from "react";
import { LogOut } from "lucide-react";
import { useUser } from "@/features/auth/hooks";
import { signOut } from "@/features/auth/actions";
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarUserFooter(): ReactElement {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="pt-6">
        <div className="flex items-center gap-3 px-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-32 h-3 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const fullName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[var(--on-surface-variant)]">
              {user?.email?.charAt(0).toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-[var(--on-surface)] truncate">
              {fullName ?? user?.email?.split("@")[0] ?? "사용자"}
            </span>
            <span className="text-xs text-[var(--outline)] truncate">
              {user?.email ?? ""}
            </span>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="p-2 hover:bg-[var(--surface-container-high)] rounded-full text-[var(--outline)] transition-colors shrink-0"
            aria-label="로그아웃"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
