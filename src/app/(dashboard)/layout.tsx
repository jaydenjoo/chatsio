import { DashboardShell } from "@/components/layouts/dashboard-shell";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return <DashboardShell>{children}</DashboardShell>;
}
