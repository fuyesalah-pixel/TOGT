"use client";

import { useMemo, useRef, useState } from "react";
import { Link2, Phone, Paperclip, Plus, Trash2, IdCard, Download, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { SearchInput } from "@/components/dashboard/shared/search-input";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { Pagination } from "@/components/dashboard/shared/pagination";
import { ConfirmDialog } from "@/components/dashboard/shared/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile } from "@/lib/api/uploads";
import {
  useCallRecordMutations,
  useCallRecords,
  useUsedTeamNumbers,
} from "@/hooks/useCallRecords";
import type {
  CallRecord,
  CallRecordHistory,
  CallRecordPayload,
  PaymentStatus,
} from "@/lib/api/types";
import { CallRecordIdCard } from "./call-record-id-card";
import { listCallRecords } from "@/lib/api/callRecords";

const PAGE_SIZE = 20;
const CURRENCIES = ["ETB", "USD"] as const;

const TEAM_NUMBERS = Array.from({ length: 100 }, (_, i) => `A${i + 1}`);

type FormState = {
  teamNumber: string;
  name: string;
  fatherName: string;
  phone: string;
  paidAmount: string;
  remainingAmount: string;
  currency: string;
  paymentStatus: PaymentStatus | "";
  flightDate: string;
  additionalInfo: string;
  passportFileUrl: string;
  otherFileUrl: string;
  idImageUrl: string;
};

const EMPTY_FORM: FormState = {
  teamNumber: "",
  name: "",
  fatherName: "",
  phone: "",
  paidAmount: "",
  remainingAmount: "",
  currency: "ETB",
  paymentStatus: "",
  flightDate: "",
  additionalInfo: "",
  passportFileUrl: "",
  otherFileUrl: "",
  idImageUrl: "",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function humanizeField(field: string) {
  return (
    field
      .replace(/([A-Z])/g, " $1")
      .replace(/^_/, "")
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
      .trim() || field
  );
}

function HistoryList({ history }: { history?: CallRecordHistory[] | null }) {
  if (!history || history.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400">No changes yet.</p>;
  }
  return (
    <ol className="space-y-3">
      {history.map((entry) => {
        const isCreate = entry.field === "created";
        return (
          <li key={entry.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="font-semibold text-togt-navy">
                {isCreate ? "Created" : humanizeField(entry.field)}
              </span>
              <span className="text-xs text-gray-500">
                {entry.changedByName} · {formatDate(entry.createdAt)}
              </span>
            </div>
            {entry.note ? (
              <p className="mt-1 text-gray-600">{entry.note}</p>
            ) : (
              <p className="mt-1 text-gray-600">
                <span className="text-gray-400">{entry.fromValue || "—"}</span>
                <span className="mx-1 text-gray-300">→</span>
                <span className="font-medium text-togt-navy">{entry.toValue}</span>
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function FileField({
  label,
  value,
  disabled,
  onChange,
  accept,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (url: string) => void;
  accept?: string;
}) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file, "misc");
      onChange(url);
      showToast({ title: "File uploaded", message: "Attached successfully." });
    } catch (error) {
      showToast({
        title: "Upload failed",
        message: error instanceof Error ? error.message : "Could not upload the image.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <Input
          type="file"
          accept={accept ?? "image/jpeg,image/png,image/gif,image/webp,application/pdf"}
          disabled={disabled || uploading}
          onChange={(e) => void handleUpload(e.target.files?.[0])}
          className="h-8 cursor-pointer text-sm"
        />
        {uploading && <span className="text-xs text-gray-400">Uploading…</span>}
      </div>
      {value && (
        <div className="mt-1.5 flex items-center gap-3">
          {accept?.includes("image") && <img src={value} alt="Uploaded preview" className="h-12 w-12 rounded-full border-2 border-togt-orange object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-togt-blue hover:underline"
          >
            <Paperclip className="h-3 w-3" /> View attached file
          </a>
        </div>
      )}
    </div>
  );
}

function PaymentStatusDisplay({ value }: { value?: PaymentStatus | null }) {
  if (!value) return <span className="text-gray-400">—</span>;
  if (value === "PAID") return <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">Paid</span>;
  if (value === "UNPAID") return <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Unpaid</span>;
  if (value === "REFUNDED") return <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700">Refunded</span>;
  return <span className="text-gray-400">—</span>;
}

export function CallTrackerTab({}: { staff?: boolean }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [idCardRecord, setIdCardRecord] = useState<CallRecord | null>(null);
  const [bulkExporting, setBulkExporting] = useState(false);
  const idCardRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      teamNumber: teamFilter || undefined,
      paymentStatus: (paymentStatus || undefined) as PaymentStatus | undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [search, teamFilter, paymentStatus, page],
  );

  const { data, isLoading, isError, error, refetch } = useCallRecords(filters);
  const { createCallRecord, updateCallRecord, deleteCallRecord } = useCallRecordMutations();
  const usedTeamNumbersQuery = useUsedTeamNumbers();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CallRecord | null>(null);
  const [deleting, setDeleting] = useState<CallRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const records = data?.data ?? [];
  const total = data?.total ?? 0;
  const usedTeamNumbers = new Set(usedTeamNumbersQuery.data?.used ?? []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setCreateOpen(true);
  };

  const openEdit = (record: CallRecord) => {
    setEditing(record);
    setForm({
      teamNumber: record.teamNumber,
      name: record.name,
      fatherName: record.fatherName ?? "",
      phone: record.phone,
      paidAmount: record.paidAmount != null ? String(record.paidAmount) : "",
      remainingAmount: record.remainingAmount != null ? String(record.remainingAmount) : "",
      currency: record.currency || "ETB",
      paymentStatus: (record.paymentStatus as PaymentStatus) ?? "",
      flightDate: record.flightDate ? record.flightDate.slice(0, 10) : "",
      additionalInfo: record.additionalInfo ?? "",
      passportFileUrl: record.passportFileUrl ?? "",
      otherFileUrl: record.otherFileUrl ?? "",
      idImageUrl: record.idImageUrl ?? "",
    });
    setFormError("");
  };

  const buildPayload = (): CallRecordPayload | null => {
    if (!form.teamNumber) {
      setFormError("Team number is required.");
      return null;
    }
    if (!form.name.trim() || !form.phone.trim()) {
      setFormError("Name and Phone are required.");
      return null;
    }
    const paid = form.paidAmount ? Number(form.paidAmount) : undefined;
    const remaining = form.remainingAmount ? Number(form.remainingAmount) : undefined;
    if (paid !== undefined && (Number.isNaN(paid) || paid < 0)) {
      setFormError("Paid amount must be a valid number.");
      return null;
    }
    if (remaining !== undefined && (Number.isNaN(remaining) || remaining < 0)) {
      setFormError("Remaining amount must be a valid number.");
      return null;
    }
    return {
      name: form.name.trim(),
      teamNumber: form.teamNumber,
      fatherName: form.fatherName.trim() || undefined,
      phone: form.phone.trim(),
      paidAmount: paid,
      remainingAmount: remaining,
      totalAmount: (paid ?? 0) + (remaining ?? 0),
      currency: form.currency,
      paymentStatus: form.paymentStatus || undefined,
      flightDate: form.flightDate || undefined,
      additionalInfo: form.additionalInfo.trim() || undefined,
      passportFileUrl: form.passportFileUrl || undefined,
      otherFileUrl: form.otherFileUrl || undefined,
      idImageUrl: form.idImageUrl || undefined,
    };
  };

  const handleCreate = () => {
    const payload = buildPayload();
    if (!payload) return;
    createCallRecord.mutate(payload, {
      onSuccess: () => {
        setCreateOpen(false);
        showToast({ title: "Call record created", message: `Team ${payload.teamNumber} record was saved.` });
      },
      onError: (err) => {
        setFormError(err instanceof Error ? err.message : "Failed to create record.");
      },
    });
  };

  const handleEdit = () => {
    if (!editing) return;
    const payload = buildPayload();
    if (!payload) return;
    updateCallRecord.mutate(
      { id: editing.id, payload },
      {
        onSuccess: () => {
          setEditing(null);
          showToast({ title: "Record updated", message: "Changes saved." });
        },
        onError: (err) => {
          setFormError(err instanceof Error ? err.message : "Failed to update record.");
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteCallRecord.mutate(deleting.id, {
      onSuccess: () => {
        showToast({ title: "Record deleted", message: `${deleting.name}'s record was removed.` });
        setDeleting(null);
      },
      onError: (err) => {
        showToast({ title: "Delete failed", message: err instanceof Error ? err.message : "Try again." });
        setDeleting(null);
      },
    });
  };

  const isSaving = createCallRecord.isPending || updateCallRecord.isPending;
  const captureIdCard = async () => {
    const source = document.getElementById("id-card-master");
    if (!source) return null;
    const bounds = source.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return null;
    const photo = source.querySelector<HTMLImageElement>("img[data-export-photo]");
    const originalPhotoUrl = photo?.src;
    try {
      if (photo && originalPhotoUrl) {
        photo.src = `/api/image-proxy?url=${encodeURIComponent(new URL(originalPhotoUrl, window.location.origin).toString())}`;
      }
      await Promise.all(Array.from(source.querySelectorAll("img")).map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => { image.onload = () => resolve(); image.onerror = () => resolve(); })));
      if (document.fonts?.ready) await document.fonts.ready;
      return await html2canvas(source, { width: 360, height: 560, scale: 3, backgroundColor: "#ffffff", useCORS: true, allowTaint: false, logging: false });
    } finally {
      if (photo && originalPhotoUrl) photo.src = originalPhotoUrl;
    }
  };

  const waitForMaster = async (recordId: string) => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const master = document.getElementById("id-card-master");
      if (master?.dataset.recordId === recordId && master.querySelector('img[alt="Scan to verify this ID"]')) return;
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
    throw new Error("ID card was not ready for export.");
  };

  const downloadPdf = async () => {
    if (!idCardRecord) return;
    const canvas = await captureIdCard();
    if (!canvas) return;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, 60, 60 * (560 / 360));
    pdf.save(`TOGT-ID-${idCardRecord.teamNumber}.pdf`);
  };

  const bulkPrint = async () => {
    if (!teamFilter) { showToast({ title: "Select a team", message: "Choose a team number before bulk printing." }); return; }
    setBulkExporting(true);
    try {
      const result = await listCallRecords({ teamNumber: teamFilter, page: 1, limit: 100 });
      if (!result.data.length) { showToast({ title: "No records", message: `No records found for team ${teamFilter}.` }); return; }
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const cardWidth = 58; const cardHeight = cardWidth * (560 / 360); const gap = 5; const marginX = 10; const marginY = 3;
      for (let index = 0; index < result.data.length; index += 1) {
        const record = result.data[index];
        let canvas: HTMLCanvasElement | null = null;
        try {
          setIdCardRecord(record);
          await waitForMaster(record.id);
          canvas = await captureIdCard();
        } catch {
          continue;
        }
        if (!canvas || canvas.width < 1 || canvas.height < 1) continue;
        if (index > 0 && index % 9 === 0) pdf.addPage();
        const slot = index % 9;
        const x = marginX + (slot % 3) * (cardWidth + gap);
        const y = marginY + Math.floor((slot % 9) / 3) * (cardHeight + gap);
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, cardWidth, cardHeight);
      }
      pdf.save(`TOGT-Team-${teamFilter}.pdf`);
    } catch (cause) {
      showToast({ title: "Bulk export failed", message: cause instanceof Error ? cause.message : "Please try again." });
    } finally {
      setBulkExporting(false);
      setIdCardRecord(null);
    }
  };

  const printIdCard = () => {
    document.body.classList.add("print-id-mode");
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => document.body.classList.remove("print-id-mode"), 500);
    }, 50);
  };

  return (
    <div>
      <PageHeader
        title="Call Tracker"
        description="Track customer call records, payments, and files."
        actions={
          <Button onClick={openCreate} className="bg-togt-orange text-white hover:bg-togt-orange/90">
            <Plus className="h-4 w-4" /> Add Call Record
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-56 flex-1">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, phone, team..." />
        </div>
        <select
          value={teamFilter}
          onChange={(e) => { setTeamFilter(e.target.value); setPage(1); }}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">All Teams</option>
          {TEAM_NUMBERS.map((t) => (
            <option key={t} value={t}>{t}{usedTeamNumbers.has(t) ? "" : " (empty)"}</option>
          ))}
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <Button variant="outline" size="sm" disabled={!teamFilter || bulkExporting} onClick={() => void bulkPrint()}>
          {bulkExporting ? "Preparing…" : "Bulk Print"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <p className="font-semibold text-red-700">Could not load call records.</p>
          <p className="mt-1 text-sm text-red-600">{error instanceof Error ? error.message : "Please try again."}</p>
          <Button variant="outline" className="mt-4" onClick={() => void refetch()}>Retry</Button>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <EmptyState title="No call records yet" description="Add a call record using the button above." />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Flight Date</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Remaining</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">ID Card</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      onClick={() => openEdit(record)}
                      className="cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-togt-blue/5"
                    >
                      <td className="px-4 py-3 font-bold text-togt-blue">{record.teamNumber}</td>
                      <td className="px-4 py-3 font-medium text-togt-navy">{record.name}</td>
                      <td className="px-4 py-3 text-gray-600">{record.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{formatShortDate(record.flightDate)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {record.paidAmount != null ? `${record.paidAmount.toLocaleString()} ${record.currency}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {record.remainingAmount != null ? `${record.remainingAmount.toLocaleString()} ${record.currency}` : "—"}
                      </td>
                      <td className="px-4 py-3"><PaymentStatusDisplay value={record.paymentStatus} /></td>
                      <td className="px-4 py-3"><Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIdCardRecord(record); }}><IdCard className="h-4 w-4" /> Generate ID</Button></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(record.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(record); }}>View</Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleting(record); }} aria-label="Delete">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {records.map((record) => (
              <button
                key={record.id}
                onClick={() => openEdit(record)}
                className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-togt-blue">{record.teamNumber}</span>
                  <PaymentStatusDisplay value={record.paymentStatus} />
                </div>
                <p className="mt-2 font-semibold text-togt-navy">{record.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500"><Phone className="h-3 w-3" />{record.phone}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>Flight: {formatShortDate(record.flightDate)}</span>
                  {record.paidAmount != null && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-green-600">Paid: {record.paidAmount.toLocaleString()} {record.currency}</span>
                    </>
                  )}
                  {record.remainingAmount != null && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-red-600">Due: {record.remainingAmount.toLocaleString()} {record.currency}</span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>

          <Pagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Add Call Record" description="New call record" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Team Number *</Label>
              <select
                value={form.teamNumber}
                onChange={(e) => setForm({ ...form, teamNumber: e.target.value })}
                className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="">Select team number</option>
                {TEAM_NUMBERS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Parent/Guardian</Label>
              <Input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Paid Amount</Label>
              <Input inputMode="decimal" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} className="mt-1" placeholder="0" />
            </div>
            <div>
              <Label>Remaining Amount</Label>
              <Input inputMode="decimal" value={form.remainingAmount} onChange={(e) => setForm({ ...form, remainingAmount: e.target.value })} className="mt-1" placeholder="0" />
            </div>
            <div>
              <Label>Currency</Label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Payment Status</Label>
              <select
                value={form.paymentStatus}
                onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus | "" })}
                className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="">Not set</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
            <div>
              <Label>Flight Date</Label>
              <Input
                type="date"
                value={form.flightDate}
                onChange={(e) => setForm({ ...form, flightDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <FileField label="Passport Image (Optional)" value={form.passportFileUrl} onChange={(url) => setForm({ ...form, passportFileUrl: url })} />
            </div>
            <div className="sm:col-span-2">
              <FileField label="Other File (Optional)" value={form.otherFileUrl} onChange={(url) => setForm({ ...form, otherFileUrl: url })} />
            </div>
            <div className="sm:col-span-2">
              <FileField label="ID Image (Optional)" value={form.idImageUrl} accept="image/jpeg,image/png,image/webp" onChange={(url) => setForm({ ...form, idImageUrl: url })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Additional Info</Label>
              <Textarea rows={3} value={form.additionalInfo} onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })} className="mt-1" />
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSaving} className="bg-togt-blue text-white hover:bg-togt-blue/90">
              {isSaving ? "Saving…" : "Save Record"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit / View dialog */}
      <AnimatePresence>
        {editing && (
          <Dialog open onClose={() => setEditing(null)} title={`${editing.name} · ${editing.teamNumber}`} description={`Created ${formatDate(editing.createdAt)}${editing.updatedBy ? ` · Updated ${formatDate(editing.updatedAt)}` : ""}`} size="xl">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Team Number</Label>
                  <select value={form.teamNumber} onChange={(e) => setForm({ ...form, teamNumber: e.target.value })} className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2.5 font-mono text-sm">
                    {TEAM_NUMBERS.map((team) => <option key={team} value={team}>{team}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Parent/Guardian</Label>
                  <Input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Paid Amount</Label>
                  <Input inputMode="decimal" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} className="mt-1" placeholder="0" />
                </div>
                <div>
                  <Label>Remaining Amount</Label>
                  <Input inputMode="decimal" value={form.remainingAmount} onChange={(e) => setForm({ ...form, remainingAmount: e.target.value })} className="mt-1" placeholder="0" />
                </div>
                <div>
                  <Label>Currency</Label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <select
                    value={form.paymentStatus}
                    onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus | "" })}
                    className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    <option value="">Not set</option>
                    <option value="PAID">Paid</option>
                    <option value="UNPAID">Unpaid</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
                <div>
                  <Label>Flight Date</Label>
                  <Input
                    type="date"
                    value={form.flightDate}
                    onChange={(e) => setForm({ ...form, flightDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Additional Info</Label>
                  <Input value={form.additionalInfo} onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <FileField label="Passport Image" value={form.passportFileUrl} onChange={(url) => setForm({ ...form, passportFileUrl: url })} />
                </div>
                <div className="sm:col-span-2">
                  <FileField label="Other File" value={form.otherFileUrl} onChange={(url) => setForm({ ...form, otherFileUrl: url })} />
                </div>
                <div className="sm:col-span-2">
                  <FileField label="ID Image (Optional)" value={form.idImageUrl} accept="image/jpeg,image/png,image/webp" onChange={(url) => setForm({ ...form, idImageUrl: url })} />
                </div>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-togt-navy">
                  <Link2 className="h-4 w-4 text-togt-orange" /> Change History
                </h3>
                <HistoryList history={editing.history} />
              </div>

              <div className="flex justify-end gap-2">
                {isAdmin && (
                  <Button variant="destructive" onClick={() => { setDeleting(editing); setEditing(null); }} disabled={isSaving}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                )}
                <Button variant="outline" onClick={() => setEditing(null)} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleEdit} disabled={isSaving} className="bg-togt-blue text-white hover:bg-togt-blue/90">
                  {isSaving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleting?.name ?? "record"}?`}
        description={`This will permanently remove team ${deleting?.teamNumber ?? ""}.`}
        confirmLabel="Delete"
        destructive
        isPending={deleteCallRecord.isPending}
      />

      <Dialog open={!!idCardRecord} onClose={() => setIdCardRecord(null)} title="TOGT ID Card" description="Print or download this vertical identification card." size="md">
        {idCardRecord && (
          <div className="space-y-4">
            <div ref={idCardRef} className="mx-auto w-fit"><CallRecordIdCard record={idCardRecord} /></div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={printIdCard}><Printer className="h-4 w-4" /> Print</Button>
              <Button variant="outline" onClick={() => void downloadPdf()}><Download className="h-4 w-4" /> Download PDF</Button>
              <Button onClick={async () => {
                const canvas = await captureIdCard();
                if (!canvas) return;
                const link = document.createElement("a");
                link.download = `togt-id-${idCardRecord.teamNumber}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
              }} className="bg-togt-blue text-white hover:bg-togt-blue/90"><Download className="h-4 w-4" /> Download PNG</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
