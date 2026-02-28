import { DealSectionSkeleton } from "@/components/deals/deal-card-skeleton";

export default function MainLoading() {
  return (
    <div className="space-y-6 py-5">
      <DealSectionSkeleton />
      <DealSectionSkeleton />
      <DealSectionSkeleton />
    </div>
  );
}
