import { Skeleton } from "@/components/ui/skeleton";

export default function RenewalsLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <Skeleton className="h-7 w-64" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-12 rounded-2xl" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
