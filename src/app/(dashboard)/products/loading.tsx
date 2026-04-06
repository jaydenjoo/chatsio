import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* PageHeader skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-32 rounded" />
          <Skeleton className="h-4 w-64 rounded mt-2" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>

      {/* SearchBar skeleton */}
      <Skeleton className="h-16 rounded-2xl" />

      {/* Table skeleton */}
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
