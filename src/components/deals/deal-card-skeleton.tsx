import { Skeleton } from "@/components/ui/skeleton";

interface DealCardSkeletonProps {
  horizontal?: boolean;
}

export function DealCardSkeleton({ horizontal = false }: DealCardSkeletonProps) {
  return (
    <div className={horizontal ? "flex-shrink-0 w-[280px]" : "w-full"}>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Skeleton className="aspect-[16/9] rounded-none" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-12" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
