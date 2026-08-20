"use client";

import { Bell, CheckCircle2, ClipboardList, Loader } from "lucide-react";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useNotifications } from "@/hooks/useNotifications";
import { StatCard } from "../shared/stat-card";
import { PageHeader } from "../shared/page-header";
import { StatusBadge } from "../shared/status-badge";
import { LoadingSpinner } from "../shared/loading-spinner";

export function CustomerOverviewTab({ onGoToRequests, submitted }: { onGoToRequests: () => void; submitted?: boolean }) {
  const { data: requests, isLoading } = useServiceRequests({ limit: 100 });
  const { data: notifications } = useNotifications();

  if (isLoading) return <LoadingSpinner label="Loading your overview..." />;

  const all = requests?.data ?? [];
  const active = all.filter((r) => ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(r.status));
  const completed = all.filter((r) => r.status === "COMPLETED");
  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div>
      <PageHeader title="Overview" description="Your travel activity at a glance" />
      {submitted && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Your request has been submitted. Track it in your dashboard.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Requests" value={all.length} icon={ClipboardList} accent="blue" />
        <StatCard label="In Progress" value={active.length} icon={Loader} accent="orange" />
        <StatCard label="Completed" value={completed.length} icon={CheckCircle2} accent="green" />
        <StatCard label="Unread Notifications" value={unread} icon={Bell} accent="navy" />
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-sm font-bold text-togt-navy">Recent activity</h2>
          <button onClick={onGoToRequests} className="text-xs font-semibold text-togt-blue hover:underline">
            View all requests
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {all.slice(0, 5).length ? (
            all.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-togt-navy">{r.serviceType.replace(/_/g, " ")}</p>
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge value={r.status} />
              </div>
            ))
          ) : (
            <p className="px-5 py-6 text-sm text-gray-400">
              No requests yet — submit one from the website to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
