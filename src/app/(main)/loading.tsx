import { DealSectionSkeleton } from "@/components/deals/deal-card-skeleton";

export default function HomeLoading() {
  return (
    <div className="space-y-6 py-5">
      <DealSectionSkeleton />
      <DealSectionSkeleton />
      <DealSectionSkeleton />
    </div>
  );
}
