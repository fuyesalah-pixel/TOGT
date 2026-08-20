"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Paperclip } from "lucide-react";
import type { ServiceRequest } from "@/lib/api/types";
import { useRequestHistory, useServiceRequests, useUploadRequestDocument } from "@/hooks/useServiceRequests";
import { useChatSocket } from "@/hooks/useChat";
import { DataTable } from "../shared/data-table";
import { PageHeader } from "../shared/page-header";
import { Pagination } from "../shared/pagination";
import { StatusBadge } from "../shared/status-badge";
import { LoadingSpinner } from "../shared/loading-spinner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { initializePayment } from "@/lib/api/payment";

const STATUS_STEPS = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED"] as const;

function RequestTimeline({ requestId }: { requestId: string }) {
  const { data: history, isLoading } = useRequestHistory(requestId);
  if (isLoading) return <LoadingSpinner />;
  if (!history || history.length === 0) {
    return <p className="text-sm text-gray-400">No progress updates yet — check back soon.</p>;
  }
  return (
    <ol className="relative space-y-4 border-l-2 border-gray-100 pl-5">
      {history.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-togt-blue shadow" />
          <div className="text-sm">
            <StatusBadge value={h.statusFrom} /> <span className="text-gray-400">→</span>{" "}
            <StatusBadge value={h.statusTo} />
          </div>
          {h.notes && <p className="mt-0.5 text-xs text-gray-500">“{h.notes}”</p>}
          <p className="mt-0.5 text-[11px] text-gray-400">
            {h.changedBy?.fullName ?? "TOGT"} · {new Date(h.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}

function StatusSteps({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return <StatusBadge value="CANCELLED" />;
  }
  const currentIndex = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);
  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <span
            className={`h-2.5 w-2.5 rounded-full ${i <= currentIndex ? "bg-togt-orange" : "bg-gray-200"}`}
            title={step}
          />
          {i < STATUS_STEPS.length - 1 && (
            <span className={`h-0.5 w-6 ${i < currentIndex ? "bg-togt-orange" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs text-gray-500">{status.replace(/_/g, " ")}</span>
    </div>
  );
}

export function RequestsTab({ onChatWith }: { onChatWith: (userId: string) => void }) {
  useChatSocket();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const { data, isLoading } = useServiceRequests({ page, limit: 10 });
  const uploadDocument = useUploadRequestDocument();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const payNow = async (request: ServiceRequest) => { if (!request.amount) return; setPaymentError(null); try { const payment = await initializePayment(request.id, request.amount, request.currency); window.location.href = payment.checkoutUrl; } catch (error) { setPaymentError(error instanceof Error ? error.message : "Payment initialization failed"); } };

  useEffect(() => {
    if (selected) {
      const fresh = data?.data.find((r) => r.id === selected.id);
      if (fresh && fresh !== selected) setSelected(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div>
      <PageHeader title="My Requests" description="Track all your service requests" />
      {paymentError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Payment failed: {paymentError}. Please try again or contact support.</p>}

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <DataTable<ServiceRequest>
          isLoading={isLoading}
          rows={data?.data ?? []}
          emptyTitle="No requests yet"
          emptyDescription="Submit a request from the website and it will appear here."
          onRowClick={setSelected}
          columns={[
            { key: "serviceType", label: "Service", render: (r) => <span className="font-semibold">{r.serviceType.replace(/_/g, " ")}</span> },
            { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
            { key: "payment", label: "Payment", render: (r) => <div className="flex items-center gap-2"><StatusBadge value={r.paymentStatus} />{r.paymentStatus === "UNPAID" && r.amount && <Button size="sm" onClick={(event) => { event.stopPropagation(); void payNow(r); }}>Pay Now</Button>}</div> },
            { key: "progress", label: "Progress", render: (r) => <StatusSteps status={r.status} /> },
            { key: "assignedTo", label: "Handled by", render: (r) => r.assignedTo?.fullName ?? "—" },
            { key: "createdAt", label: "Submitted", render: (r) => new Date(r.createdAt).toLocaleDateString() },
          ]}
        />
        {data && (
          <div className="px-3 pb-3">
            <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.serviceType.replace(/_/g, " ")} request` : undefined}
        description={selected ? `Submitted ${new Date(selected.createdAt).toLocaleString()}` : undefined}
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            <StatusSteps status={selected.status} />

            <div className="rounded-xl border border-gray-100 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Your request</h3>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {Object.entries(selected.formData ?? {}).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-gray-400">{key.replace(/([A-Z])/g, " $1").trim()}</dt>
                    <dd className="font-medium text-togt-navy">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Progress timeline</h3>
              <RequestTimeline requestId={selected.id} />
            </div>

            <div className="rounded-xl border border-dashed border-gray-200 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Upload documents</p>
              <input id="request-document" type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadDocument.mutate({ id: selected.id, file }); event.target.value = ""; }} />
              <label htmlFor="request-document" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-togt-navy hover:border-togt-orange">
                <Paperclip className="h-4 w-4" />{uploadDocument.isPending ? "Uploading..." : "Attach file"}
              </label>
              <p className="mt-1 text-xs text-gray-400">PDF, JPG, PNG or WebP, maximum 10MB.</p>
            </div>

            {selected.assignedToId && (
              <div className="flex items-center justify-between rounded-xl bg-togt-blue/5 p-4">
                <div className="text-sm">
                  <p className="font-semibold text-togt-navy">
                    {selected.assignedTo?.fullName ?? "A TOGT worker"} is handling your request
                  </p>
                  <p className="text-xs text-gray-500">Questions? Chat directly with them.</p>
                </div>
                <Button
                  onClick={() => onChatWith(selected.assignedToId as string)}
                  className="bg-togt-blue text-white hover:bg-togt-blue/90"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat with worker
                </Button>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
