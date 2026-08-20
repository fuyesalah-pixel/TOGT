"use client";

import { Star } from "lucide-react";
import type { ServiceRequest } from "@/lib/api/types";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { DataTable } from "../shared/data-table";
import { PageHeader } from "../shared/page-header";
import { StatusBadge } from "../shared/status-badge";
import { Button } from "@/components/ui/button";

export function HistoryTab({ onReview }: { onReview: (request: ServiceRequest) => void }) {
  const { data: completed } = useServiceRequests({ status: "COMPLETED", limit: 50 });
  const { data: cancelled } = useServiceRequests({ status: "CANCELLED", limit: 50 });

  const rows = [...(completed?.data ?? []), ...(cancelled?.data ?? [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div>
      <PageHeader title="History" description="Your past completed and cancelled services" />

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <DataTable<ServiceRequest>
          isLoading={false}
          rows={rows}
          emptyTitle="No history yet"
          emptyDescription="Completed services will show up here."
          columns={[
            { key: "serviceType", label: "Service", render: (r) => <span className="font-semibold">{r.serviceType.replace(/_/g, " ")}</span> },
            { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
            {
              key: "completedAt",
              label: "Finished",
              render: (r) => (r.completedAt ? new Date(r.completedAt).toLocaleDateString() : new Date(r.updatedAt).toLocaleDateString()),
            },
            {
              key: "actions",
              label: "",
              render: (r) =>
                r.status === "COMPLETED" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onReview(r); }}
                  >
                    <Star className="h-3.5 w-3.5 text-togt-orange" />
                    Leave a review
                  </Button>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                ),
            },
          ]}
        />
      </div>
    </div>
  );
}
