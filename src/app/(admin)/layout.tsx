export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="flex min-h-screen">
      {/* TODO: Task 4-2에서 어드민 전용 사이드바 구현 */}
      <aside className="hidden w-60 shrink-0 bg-inverse-surface lg:block">
        <div className="p-6">
          <span className="text-subtitle text-inverse-on-surface">Admin</span>
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
