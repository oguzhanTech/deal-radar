import { Skeleton } from "@/components/ui/skeleton";

export default function MyRadarLoading() {
  return (
    <div className="py-5 px-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-28 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-card shadow-card">
            <Skeleton className="w-20 h-14 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-3 w-1/2 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
