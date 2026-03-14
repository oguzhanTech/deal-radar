import { Skeleton } from "@/components/ui/skeleton";

interface DealCardSkeletonProps {
  horizontal?: boolean;
  compact?: boolean;
}

export function DealCardSkeleton({ horizontal = false, compact = false }: DealCardSkeletonProps) {
  if (compact) {
    return (
      <div className="w-full">
        <div className="rounded-xl bg-card overflow-hidden shadow-sm flex gap-3 p-2.5 border border-border/40">
          <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5 py-1">
            <Skeleton className="h-3.5 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-1/3 rounded-lg" />
            <Skeleton className="h-3.5 w-1/2 rounded-lg" />
          </div>
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div className={horizontal ? "flex-shrink-0 w-[280px]" : "w-full"}>
      <div className="rounded-2xl bg-card overflow-hidden shadow-card">
        <Skeleton className="aspect-square rounded-none" />
        <div className="p-3.5 space-y-2.5">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <div className="flex justify-between">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-3.5 w-16 rounded-lg" />
            <Skeleton className="h-3.5 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DealSectionSkeleton() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-4">
        <Skeleton className="h-5 w-28 rounded-lg" />
        <Skeleton className="h-4 w-14 rounded-lg" />
      </div>
      <div className="px-4 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <DealCardSkeleton key={i} compact />
        ))}
      </div>
    </section>
  );
}
