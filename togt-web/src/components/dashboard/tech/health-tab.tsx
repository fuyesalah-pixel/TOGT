"use client";

import { Activity, ClipboardList, Database, Package, Server, Users } from "lucide-react";
import { useOverviewStats } from "@/hooks/useStats";
import { useAuth } from "@/hooks/useAuth";
import { API_URL } from "@/lib/api/client";
import { StatCard } from "../shared/stat-card";
import { PageHeader } from "../shared/page-header";

export function HealthTab() {
  const { user } = useAuth();
  const { data: stats, isLoading, isError, error, dataUpdatedAt } = useOverviewStats();

  return (
    <div>
      <PageHeader title="System Health" description="API reachability and platform metrics" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${isError ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
              <Server className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-togt-navy">
                {isLoading ? "Checking API..." : isError ? "API unreachable" : "API reachable"}
              </p>
              <p className="text-xs text-gray-400">{API_URL}</p>
            </div>
            <span className={`ml-auto h-2.5 w-2.5 rounded-full ${isError ? "bg-red-500" : "bg-emerald-500"} animate-pulse`} />
          </div>
          {isError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          )}
          {dataUpdatedAt > 0 && (
            <p className="mt-3 text-[11px] text-gray-400">
              Last checked {new Date(dataUpdatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-togt-blue/10 text-togt-blue">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-togt-navy">Session</p>
              <p className="text-xs text-gray-400">
                Signed in as {user?.email} · role {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats?.totalUsers ?? "—"} icon={Users} accent="blue" />
        <StatCard label="Active Requests" value={stats?.activeRequests ?? "—"} icon={Activity} accent="orange" />
        <StatCard label="Packages" value={stats?.totalPackages ?? "—"} icon={Package} accent="navy" />
        <StatCard label="Total Requests" value={stats?.totalRequests ?? "—"} icon={ClipboardList} accent="green" />
      </div>
    </div>
  );
}
