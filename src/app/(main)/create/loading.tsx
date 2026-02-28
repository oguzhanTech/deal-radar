import { Skeleton } from "@/components/ui/skeleton";

export default function CreateLoading() {
  return (
    <div className="py-5 px-4 space-y-5">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-1 flex-1 rounded-full" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-40 rounded-lg" />
        <Skeleton className="h-3 w-48 rounded-lg" />
      </div>
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}
