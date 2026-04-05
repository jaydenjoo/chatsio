export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="flex min-h-screen">
      {/* TODO: Task 1-9에서 사이드바 + 헤더 구현 */}
      <aside className="hidden w-60 shrink-0 bg-surface-container-low lg:block">
        <div className="p-6">
          <span className="text-subtitle text-primary">Chatsio</span>
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
