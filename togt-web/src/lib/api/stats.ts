import { apiGet } from "./client";
import type { OverviewStats } from "./types";

export function getOverviewStats(): Promise<OverviewStats> {
  return apiGet<OverviewStats>("/stats/overview");
}

export interface ReportsData {
  range: { from: string; to: string };
  summary: { revenue: number; users: number; tickets: number; packages: number; activeGroups: number; requests: number };
  revenueByMonth: { name: string; revenue: number }[];
  usersByRole: { name: string; value: number }[];
  requestsByType: { name: string; value: number }[];
  requestsByStatus: { name: string; value: number }[];
  statusByService: Array<{ service: string; PENDING?: number; ACCEPTED?: number; IN_PROGRESS?: number; COMPLETED?: number; CANCELLED?: number }>;
  revenueByService: { name: string; revenue: number }[];
  originCountries: { name: string; value: number }[];
  destinationCountries: { name: string; value: number }[];
  routes: { name: string; value: number }[];
  packagePopularity: { name: string; bookings: number }[];
  userGrowth: { name: string; users: number }[];
  airlineRevenue: { name: string; revenue: number }[];
  revenueRows: { date: string; service: string; customer: string; amount: number; status: string }[];
  userRows: Array<{ id: string; fullName: string; email: string; role: string; createdAt: string; requests: number; tickets: number }>;
  ticketRows: Array<{ id: string; ticketNumber: string; airline: string; origin: string; destination: string; departureAt: string; totalAmount: number; currency: string; status: string; user: { fullName: string; email: string } }>;
  groupRows: Array<{ id: string; name: string; members: number; guide: string; status: string; progress: number }>;
}
export function getReports(params: { from: string; to: string }) { return apiGet<ReportsData>(`/stats/reports?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(params.to)}&t=${Date.now()}`); }
