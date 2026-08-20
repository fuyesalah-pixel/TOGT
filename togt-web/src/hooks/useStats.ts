"use client";

import { useQuery } from "@tanstack/react-query";
import { getOverviewStats } from "@/lib/api/stats";

export function useOverviewStats() {
  return useQuery({
    queryKey: ["stats", "overview"],
    queryFn: getOverviewStats,
    retry: 1,
  });
}
