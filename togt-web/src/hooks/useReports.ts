"use client";
import { useQuery } from "@tanstack/react-query";
import { getReports } from "@/lib/api/stats";
export function useReports(range: { from: string; to: string }) { return useQuery({ queryKey: ["reports", range], queryFn: () => getReports(range), enabled: !!range.from && !!range.to, staleTime: 0 }); }
