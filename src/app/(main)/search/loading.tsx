import { Skeleton } from "@/components/ui/skeleton";
import { DealCardSkeleton } from "@/components/deals/deal-card-skeleton";

export default function SearchLoading() {
  return (
    <div className="space-y-4 py-4">
      <div className="px-4 space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="flex gap-1.5">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
      <div className="px-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <DealCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
