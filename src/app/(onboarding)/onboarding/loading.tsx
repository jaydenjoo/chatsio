import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading(): React.ReactElement {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <Skeleton className="mb-8 h-1.5 w-full rounded-full" />
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: "var(--surface-container-lowest)",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="mt-4 h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
