"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DealSectionSkeleton, DealCardSkeleton } from "@/components/deals/deal-card-skeleton";

function HomeSkeleton() {
  return (
    <div className="space-y-6 py-5 animate-in fade-in duration-150">
      <DealSectionSkeleton />
      <DealSectionSkeleton />
      <DealSectionSkeleton />
      <div className="px-4">
        <Skeleton className="h-[72px] w-full rounded-2xl" />
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-4 py-4 animate-in fade-in duration-150">
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

function ProfileSkeleton() {
  return (
    <div className="py-5 px-4 space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-3 w-24 rounded-lg" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-20 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

function MySkeleton() {
  return (
    <div className="py-5 px-4 space-y-4 animate-in fade-in duration-150">
      <div className="flex justify-between">
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

function CreateSkeleton() {
  return (
    <div className="py-5 px-4 space-y-5 animate-in fade-in duration-150">
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

function LeaderboardSkeleton() {
  return (
    <div className="py-5 px-4 space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-3 w-28 rounded-lg" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function DealDetailSkeleton() {
  return (
    <div className="pb-24 animate-in fade-in duration-150">
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

export function getPageSkeleton(pathname: string): ReactNode {
  const path = pathname.split("?")[0];
  if (path === "/") return <HomeSkeleton />;
  if (path === "/search") return <SearchSkeleton />;
  if (path === "/profile") return <ProfileSkeleton />;
  if (path === "/my") return <MySkeleton />;
  if (path === "/create") return <CreateSkeleton />;
  if (path === "/leaderboard") return <LeaderboardSkeleton />;
  if (path.startsWith("/deal/")) return <DealDetailSkeleton />;
  return (
    <div className="py-8 px-4 animate-in fade-in duration-150">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}
