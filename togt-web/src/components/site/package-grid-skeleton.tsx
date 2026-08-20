"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder for package grids while the API fetch is in flight. */
export function PackageGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-full max-w-xs rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
        >
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-1 h-3 w-2/3" />
          <div className="mt-3 flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
}
