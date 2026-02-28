import { Skeleton } from "@/components/ui/skeleton";

export default function DealDetailLoading() {
  return (
    <div className="pb-24">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="px-4 pt-4 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-7 w-full rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
