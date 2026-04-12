export default function OptimizeHistoryLoading(): React.ReactElement {
  return (
    <div className="space-y-8">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center gap-4">
        <div className="size-10 animate-pulse rounded-xl bg-[var(--surface-container)]" />
        <div className="space-y-2">
          <div className="h-7 w-32 animate-pulse rounded-lg bg-[var(--surface-container)]" />
          <div className="h-4 w-56 animate-pulse rounded-lg bg-[var(--surface-container)]" />
        </div>
      </div>

      {/* 테이블 스켈레톤 */}
      <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-5 flex-1 animate-pulse rounded-lg bg-[var(--surface-container)]" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--surface-container)]" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--surface-container)]" />
              <div className="h-5 w-12 animate-pulse rounded-lg bg-[var(--surface-container)]" />
              <div className="h-5 w-16 animate-pulse rounded-lg bg-[var(--surface-container)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
