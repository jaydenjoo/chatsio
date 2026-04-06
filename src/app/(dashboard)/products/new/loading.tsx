import { Skeleton } from "@/components/ui/skeleton";

export default function NewProductLoading(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-[720px] space-y-8">
      {/* 뒤로가기 */}
      <Skeleton className="h-5 w-32 rounded" />

      {/* 헤더 */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-48 rounded" />
        <Skeleton className="h-5 w-80 rounded" />
      </div>

      {/* 메인 카드 */}
      <Skeleton className="h-[480px] rounded-[20px]" />

      {/* Bento */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </div>
  );
}
