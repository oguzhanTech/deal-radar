import { Skeleton } from "@/components/ui/skeleton";

interface DealCardSkeletonProps {
  horizontal?: boolean;
}

export function DealCardSkeleton({ horizontal = false }: DealCardSkeletonProps) {
  return (
    <div className={horizontal ? "flex-shrink-0 w-[280px]" : "w-full"}>
      <div className="rounded-2xl bg-card overflow-hidden shadow-card">
        <Skeleton className="aspect-[16/9] rounded-none" />
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
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-4 w-14 rounded-lg" />
      </div>
      <div className="flex gap-3 overflow-hidden px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <DealCardSkeleton key={i} horizontal />
        ))}
      </div>
    </section>
  );
}
