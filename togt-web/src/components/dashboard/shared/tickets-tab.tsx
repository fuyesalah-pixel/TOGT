"use client";

import { useEffect, useState } from "react";
import { Download, Eye, RotateCcw } from "lucide-react";
import type { TicketStatus } from "@/lib/api/types";
import { useTicketAnalytics, useTicketMutations, useTickets } from "@/hooks/useTickets";
import { useChatSocket } from "@/hooks/useChat";
import { useQueryClient } from "@tanstack/react-query";
import { listTickets } from "@/lib/api/tickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { generateTicketPDF } from "@/lib/ticket-pdf";

const statuses: TicketStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REFUND_REQUESTED"];

export function TicketsTab({ staff = false, admin = false, onRefund }: { staff?: boolean; admin?: boolean; onRefund?: (message: string) => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ id: string; status: TicketStatus } | null>(null);
  const [reason, setReason] = useState("");
  const { data, isLoading } = useTickets({ search: search || undefined, status: status || undefined });
  const { refund, update } = useTicketMutations();
  const socket = useChatSocket();
  const queryClient = useQueryClient();
  const { data: analytics } = useTicketAnalytics(admin);
  useEffect(() => { if (!socket) return; const refresh = () => queryClient.invalidateQueries({ queryKey: ["tickets"] }); socket.on("ticketStatusChanged", refresh); return () => { socket.off("ticketStatusChanged", refresh); }; }, [socket, queryClient]);
  const download = async (ticket: NonNullable<typeof data>["data"][number]) => {
    await generateTicketPDF(ticket);
  };
  const exportCsv = async () => {
    const result = await listTickets({ search: search || undefined, status: status || undefined, limit: 100 });
    const rows = [["Ticket No", "Customer", "Flight", "Route", "Date", "Status", "Amount"], ...result.data.map((ticket) => [ticket.ticketNumber, ticket.user?.email ?? "", `${ticket.airline} ${ticket.flightNumber}`, `${ticket.origin} -> ${ticket.destination}`, new Date(ticket.departureAt).toISOString(), ticket.status, `${ticket.totalAmount} ${ticket.currency}`])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "togt-ticket-report.csv"; link.click(); URL.revokeObjectURL(url);
  };
  const exportPdf = async () => {
    const result = await listTickets({ search: search || undefined, status: status || undefined, limit: 100 });
    for (const ticket of result.data) await download(ticket);
  };
  return <div>
    <PageHeader title={staff ? "All Tickets" : "My Tickets"} description={staff ? "Search, review, and process ticket lifecycle actions." : "Your upcoming and past flights."} />
    <div className="mb-4 flex flex-wrap gap-3"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Email or ticket number..." className="max-w-sm" /><select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus | "")} className="h-9 rounded-lg border border-input bg-background px-2 text-sm"><option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>{admin && <><Button variant="outline" onClick={exportCsv}>Export CSV</Button><Button variant="outline" onClick={exportPdf}>Export PDF</Button></>}</div>
    {admin && analytics && <div className="mb-5 grid gap-4 md:grid-cols-3"><div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs uppercase text-gray-400">Revenue by airline</p>{analytics.revenueByAirline.slice(0, 4).map(([name, amount]) => <p key={name} className="mt-2 flex justify-between text-sm"><span>{name}</span><b>{amount.toLocaleString()} ETB</b></p>)}</div><div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs uppercase text-gray-400">Popular routes</p>{analytics.popularRoutes.slice(0, 4).map(([route, count]) => <p key={route} className="mt-2 flex justify-between text-sm"><span>{route}</span><b>{count}</b></p>)}</div><div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs uppercase text-gray-400">Monthly revenue</p>{analytics.monthlyRevenue.slice(-4).map(([month, amount]) => <p key={month} className="mt-2 flex justify-between text-sm"><span>{month}</span><b>{amount.toLocaleString()} ETB</b></p>)}</div></div>}
    <div className="space-y-3">{isLoading && <p className="text-sm text-gray-500">Loading tickets...</p>}{!isLoading && !data?.data.length && <p className="rounded-xl bg-white p-6 text-sm text-gray-500">No tickets found.</p>}{data?.data.map((ticket) => <div key={ticket.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-bold text-togt-navy">{ticket.airline} — {ticket.flightNumber}</h3><StatusBadge value={ticket.status} /></div><p className="mt-1 text-sm text-gray-500">{ticket.origin} → {ticket.destination} · {new Date(ticket.departureAt).toLocaleString()}</p><p className="mt-1 text-sm text-gray-500">{staff ? `${ticket.user?.fullName ?? ""} · ${ticket.user?.email ?? ""} · ` : ""}Passenger: {ticket.passengerName} · Ticket: {ticket.ticketNumber}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => download(ticket)}><Download className="mr-1 h-4 w-4" /> Download</Button>{!staff && ticket.status !== "CANCELLED" && ticket.status !== "COMPLETED" && <Button size="sm" variant="outline" disabled={refund.isPending} onClick={async () => { await refund.mutateAsync({ id: ticket.id }); onRefund?.(`Hello, I'd like to request a refund for ticket ${ticket.ticketNumber} (${ticket.origin} → ${ticket.destination}, ${new Date(ticket.departureAt).toLocaleDateString()})`); }}><RotateCcw className="mr-1 h-4 w-4" /> Refund</Button>}{staff && <><select value={ticket.status} onChange={(e) => { setPendingStatus({ id: ticket.id, status: e.target.value as TicketStatus }); setReason(""); }} className="h-8 rounded-lg border border-input bg-background px-2 text-xs"><option value={ticket.status}>{ticket.status.replace("_", " ")}</option>{statuses.filter((s) => s !== ticket.status).map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select><Button size="sm" variant="ghost" onClick={() => setSelectedId(selectedId === ticket.id ? null : ticket.id)}><Eye className="mr-1 h-4 w-4" /> Details</Button></>}</div></div>{selectedId === ticket.id && <div className="mt-4 border-t pt-4 text-sm text-gray-600"><p>Payment: {ticket.paymentMethod ?? "Not specified"} · Total: {ticket.totalAmount.toLocaleString()} {ticket.currency}</p><p className="mt-2 font-semibold text-togt-navy">History</p>{ticket.history?.map((item) => <p key={item.id} className="mt-1">{new Date(item.createdAt).toLocaleString()}: {item.statusTo.replace("_", " ")} — by {item.changedByName ?? "Unknown"} — {item.reason ?? item.note ?? "No reason"} ({new Date(item.createdAt).toLocaleString()})</p>)}</div>}</div>)}</div>
    {pendingStatus && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 className="text-lg font-bold text-togt-navy">Reason for status change</h2><p className="mt-1 text-sm text-gray-500">A reason is required and will be visible in the ticket history.</p><textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-4 min-h-24 w-full rounded-lg border p-3 text-sm" placeholder="Payment received" /><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setPendingStatus(null)}>Cancel</Button><Button disabled={!reason.trim() || update.isPending} onClick={() => { if (pendingStatus) update.mutate({ id: pendingStatus.id, status: pendingStatus.status, note: reason.trim() }, { onSuccess: () => setPendingStatus(null) }); }}>Submit Status Change</Button></div></div></div>}
  </div>;
}
