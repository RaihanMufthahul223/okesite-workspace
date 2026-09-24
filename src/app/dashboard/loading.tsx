import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-[300px] rounded-2xl lg:col-span-2" />
        <div className="space-y-4">
          <Skeleton className="h-[260px] rounded-2xl" />
          <Skeleton className="h-[260px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
