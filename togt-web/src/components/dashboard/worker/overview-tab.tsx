"use client";

import { ClipboardList, Package, Users, Hourglass } from "lucide-react";
import { useOverviewStats } from "@/hooks/useStats";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { StatCard } from "../shared/stat-card";
import { PageHeader } from "../shared/page-header";
import { StatusBadge } from "../shared/status-badge";
import { LoadingSpinner } from "../shared/loading-spinner";

export function OverviewTab() {
  const { data: stats, isLoading } = useOverviewStats();
  const { data: recent } = useServiceRequests({ limit: 5 });

  if (isLoading) return <LoadingSpinner label="Loading overview..." />;

  return (
    <div>
      <PageHeader title="Overview" description="Key metrics for TOGT operations" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} accent="blue" hint={`${stats?.activeUsers ?? 0} active`} />
        <StatCard label="Active Requests" value={stats?.activeRequests ?? 0} icon={ClipboardList} accent="orange" hint={`${stats?.pendingRequests ?? 0} pending`} />
        <StatCard label="Packages" value={stats?.totalPackages ?? 0} icon={Package} accent="navy" hint={`${stats?.activePackages ?? 0} active`} />
        <StatCard label="Completed" value={stats?.completedRequests ?? 0} icon={Hourglass} accent="green" hint={`${stats?.totalRequests ?? 0} total requests`} />
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-sm font-bold text-togt-navy">Recent service requests</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recent?.data?.length ? (
            recent.data.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-togt-navy">{r.user?.fullName ?? "Customer"}</p>
                  <p className="text-xs text-gray-400">{r.serviceType.replace(/_/g, " ")}</p>
                </div>
                <StatusBadge value={r.status} />
              </div>
            ))
          ) : (
            <p className="px-5 py-6 text-sm text-gray-400">No requests yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
