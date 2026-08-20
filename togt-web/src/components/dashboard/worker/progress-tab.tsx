"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { RequestStatus, ServiceRequest } from "@/lib/api/types";
import { useRequestHistory, useServiceRequests, useUpdateRequestStatus } from "@/hooks/useServiceRequests";
import { useChatSocket } from "@/hooks/useChat";
import { DataTable } from "../shared/data-table";
import { PageHeader } from "../shared/page-header";
import { Pagination } from "../shared/pagination";
import { SearchInput } from "../shared/search-input";
import { StatusBadge } from "../shared/status-badge";
import { LoadingSpinner } from "../shared/loading-spinner";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const STATUS_FILTERS: (RequestStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const NEXT_STATUSES: RequestStatus[] = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

function RequestDetailDialog({
  request,
  open,
  onClose,
}: {
  request: ServiceRequest | null;
  open: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<RequestStatus>("PENDING");
  const [notes, setNotes] = useState("");
  const [assignToMe, setAssignToMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateStatus = useUpdateRequestStatus();
  const { data: history, isLoading: historyLoading } = useRequestHistory(request?.id);

  // sync local state when a new request is opened
  useEffect(() => {
    if (request) {
      setStatus(request.status);
      setNotes("");
      setAssignToMe(false);
      setError(null);
    }
  }, [request]);

  if (!request) return null;

  const handleSave = async () => {
    setError(null);
    try {
      await updateStatus.mutateAsync({
        id: request.id,
        dto: { status, notes: notes || undefined, assignToMe },
      });
      setNotes("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${request.serviceType.replace(/_/g, " ")} request`}
      description={`Submitted by ${request.user?.fullName ?? "customer"} · ${new Date(request.createdAt).toLocaleString()}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Current state */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={request.status} />
          {request.assignedTo && (
            <span className="text-xs text-gray-500">
              Assigned to <b>{request.assignedTo.fullName}</b>
            </span>
          )}
        </div>

        {/* Submitted data */}
        <div className="rounded-xl border border-gray-100 p-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Request details</h3>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {Object.entries(request.formData ?? {}).map(([key, value]) => (
              <div key={key}>
                <dt className="text-gray-400">{key.replace(/([A-Z])/g, " $1").trim()}</dt>
                <dd className="font-medium text-togt-navy">{String(value)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 border-t border-gray-50 pt-3 text-sm">
            <span className="text-gray-400">Customer: </span>
            <span className="font-medium">{request.user?.fullName}</span>
            <span className="ml-2 text-gray-400">{request.user?.email}</span>
            {request.user?.phone && <span className="ml-2 text-gray-400">{request.user.phone}</span>}
          </div>
        </div>

        {/* Status update */}
        <div className="rounded-xl border border-gray-100 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Update status</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="status">New status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as RequestStatus)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                {NEXT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-togt-navy">
                <input
                  type="checkbox"
                  checked={assignToMe}
                  onChange={(e) => setAssignToMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Assign to me
              </label>
            </div>
          </div>
          <div className="mt-3">
            <Label htmlFor="notes">Progress note</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional note logged to the history..."
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-3">
            <Button
              onClick={handleSave}
              disabled={updateStatus.isPending}
              className="bg-togt-blue text-white hover:bg-togt-blue/90"
            >
              {updateStatus.isPending ? "Saving..." : "Save status update"}
            </Button>
          </div>
        </div>

        {/* History timeline */}
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">History</h3>
          {historyLoading ? (
            <LoadingSpinner />
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-gray-400">No status changes recorded yet.</p>
          ) : (
            <ol className="relative space-y-4 border-l-2 border-gray-100 pl-5">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-togt-orange shadow" />
                  <div className="text-sm">
                    <span className="font-semibold text-togt-navy">{h.changedBy?.fullName ?? "System"}</span>
                    <span className="text-gray-500"> changed status </span>
                    <StatusBadge value={h.statusFrom} /> <span className="text-gray-400">→</span>{" "}
                    <StatusBadge value={h.statusTo} />
                  </div>
                  {h.notes && <p className="mt-0.5 text-xs text-gray-500">“{h.notes}”</p>}
                  <p className="mt-0.5 text-[11px] text-gray-400">{new Date(h.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Dialog>
  );
}

export function ProgressTab() {
  useChatSocket();
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ServiceRequest | null>(null);

  const { data, isLoading } = useServiceRequests({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: search || undefined,
    page,
    limit: 15,
  });

  return (
    <div>
      <PageHeader
        title="Progress"
        description="Track and update service requests — every change is logged"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              statusFilter === s
                ? "bg-togt-navy text-white"
                : "bg-white text-gray-500 border border-gray-200 hover:border-togt-navy/30",
            )}
          >
            {s === "ALL" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
        <div className="ml-auto w-full sm:w-64">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search customer..." />
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <DataTable<ServiceRequest>
          isLoading={isLoading}
          rows={data?.data ?? []}
          emptyTitle="No requests"
          emptyDescription="No service requests match this filter."
          onRowClick={setSelected}
          columns={[
            { key: "user", label: "Customer", render: (r) => <span className="font-semibold">{r.user?.fullName ?? "—"}</span> },
            { key: "serviceType", label: "Service", render: (r) => r.serviceType.replace(/_/g, " ") },
            { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
            { key: "payment", label: "Payment", render: (r) => <div><StatusBadge value={r.paymentStatus} />{r.amount ? <p className="mt-1 text-xs text-gray-500">{r.amount.toLocaleString()} {r.currency}</p> : null}</div> },
            { key: "assignedTo", label: "Assigned to", render: (r) => r.assignedTo?.fullName ?? "—" },
            { key: "createdAt", label: "Created", render: (r) => new Date(r.createdAt).toLocaleDateString() },
            { key: "updatedAt", label: "Updated", render: (r) => new Date(r.updatedAt).toLocaleDateString() },
          ]}
        />
        {data && (
          <div className="px-3 pb-3">
            <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <RequestDetailDialog
        request={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
