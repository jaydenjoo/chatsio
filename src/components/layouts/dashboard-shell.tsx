"use client";

import { useState, type ReactElement } from "react";
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { MobileSidebar } from "@/components/layouts/mobile-sidebar";

export function DashboardShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
      <div className="md:ml-[260px] flex flex-col min-h-screen">
        <Header onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
