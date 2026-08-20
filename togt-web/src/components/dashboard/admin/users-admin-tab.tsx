"use client";

import { useState } from "react";
import { Eye, ShieldCheck, ShieldOff, X } from "lucide-react";
import type { Role, Status, User } from "@/lib/api/types";
import { useUser, useUserMutations, useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { DataTable } from "../shared/data-table";
import { PageHeader } from "../shared/page-header";
import { Pagination } from "../shared/pagination";
import { SearchInput } from "../shared/search-input";
import { StatusBadge } from "../shared/status-badge";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getUserChanges } from "@/lib/api/users";
import { listServiceRequests } from "@/lib/api/service-requests";

const ROLES: Role[] = ["CUSTOMER", "WORKER", "GUIDE", "ADMIN", "TECH"];

export function UsersAdminTab() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingStatus, setPendingStatus] = useState<{ user: User; status: Status } | null>(null);
  const [status, setStatus] = useState<Status | "">("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [changesUser, setChangesUser] = useState<User | null>(null);
  const [infoUser, setInfoUser] = useState<User | null>(null);
  const [requestsUser, setRequestsUser] = useState<User | null>(null);
  const { data: info } = useUser(infoUser?.id);
  const { data: userRequests } = useQuery({ queryKey: ["users", "requests", requestsUser?.id], queryFn: () => listServiceRequests({ search: requestsUser!.email, limit: 100 }), enabled: !!requestsUser });
  const { data: changes, isLoading: changesLoading } = useQuery({
    queryKey: ["users", "changes", changesUser?.id],
    queryFn: () => getUserChanges(changesUser!.id),
    enabled: !!changesUser,
  });

  const { data, isLoading } = useUsers({ search: search || undefined, status: status || undefined, page, limit: 15 });
  const { changeUserRole, setUserStatus } = useUserMutations();

  const handleRoleChange = async (user: User, role: Role) => {
    setFeedback(null);
    try {
      await changeUserRole.mutateAsync({ id: user.id, role });
      setFeedback(`Role updated for ${user.fullName}`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to change role");
    }
  };

  return (
    <div>
      <PageHeader
        title="Users (Admin)"
        description="Change roles and terminate accounts. Admin accounts are protected."
      />

      {feedback && (
        <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-togt-navy">{feedback}</p>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Name, email or phone..." />
        <select value={status} onChange={(e) => { setStatus(e.target.value as Status | ""); setPage(1); }} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <DataTable<User>
          isLoading={isLoading}
          rows={data?.data ?? []}
          emptyTitle="No users found"
          onRowClick={undefined}
          columns={[
            { key: "fullName", label: "Name", render: (u) => <span className="font-semibold">{u.fullName}</span> },
            { key: "email", label: "Email" },
            { key: "status", label: "Status", render: (u) => <StatusBadge value={u.status} /> },
            {
              key: "role",
              label: "Role",
              render: (u) =>
                u.id === currentUser?.id ? (
                  <StatusBadge value={u.role} />
                ) : (
                  <select
                    value={u.role}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                    disabled={changeUserRole.isPending}
                    className="h-7 rounded-lg border border-input bg-background px-2 text-xs"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                ),
            },
            { key: "createdAt", label: "Joined", render: (u) => new Date(u.createdAt).toLocaleDateString() },
            { key: "requests", label: "Requests", render: (u) => <Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); setRequestsUser(u); }} className="font-semibold text-togt-blue">👁 {u._count?.serviceRequests ?? 0}</Button> },
            { key: "info", label: "See Info", render: (u) => <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setInfoUser(u); }}><Eye className="mr-1 h-4 w-4" /> Info</Button> },
            {
              key: "changes",
              label: "See Changes",
              render: (u) => <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setChangesUser(u); }}><Eye className="mr-1 h-4 w-4" /> Changes</Button>,
            },
            {
              key: "actions",
              label: "Actions",
              render: (u) => {
                const protectedUser = u.role === "ADMIN" || u.id === currentUser?.id;
                const isTerminated = u.status === "TERMINATED";
                return (
                  <Button
                    variant={isTerminated ? "secondary" : "ghost"}
                    size="sm"
                    disabled={protectedUser}
                    onClick={(e) => { e.stopPropagation(); setPendingStatus({ user: u, status: isTerminated ? "ACTIVE" : "TERMINATED" }); }}
                    title={protectedUser ? "Protected account" : isTerminated ? "Reactivate user" : "Terminate user"}
                  >
                    {isTerminated ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <ShieldOff className="h-4 w-4 text-red-500" />}
                    {isTerminated ? "Reactivate" : "Terminate"}
                  </Button>
                );
              },
            },
          ]}
        />
        {data && (
          <div className="px-3 pb-3">
            <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingStatus}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => {
          if (pendingStatus) {
            setUserStatus.mutate(
              { id: pendingStatus.user.id, status: pendingStatus.status },
              { onSettled: () => setPendingStatus(null) },
            );
          }
        }}
        title={pendingStatus?.status === "ACTIVE" ? "Reactivate user" : "Terminate user"}
        description={pendingStatus?.status === "ACTIVE"
          ? `Reactivate ${pendingStatus.user.fullName}? They will be able to sign in again.`
          : `Terminate ${pendingStatus?.user.fullName}? They will be logged out and blocked from signing in.`}
        confirmLabel={pendingStatus?.status === "ACTIVE" ? "Reactivate" : "Terminate"}
        destructive={pendingStatus?.status !== "ACTIVE"}
        isPending={setUserStatus.isPending}
      />

      {changesUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold text-togt-navy">Profile Changes</h2><p className="text-sm text-gray-500">{changesUser.fullName}</p></div><Button variant="ghost" size="icon" onClick={() => setChangesUser(null)}><X className="h-4 w-4" /></Button></div>
            {changesLoading && <p className="text-sm text-gray-500">Loading changes...</p>}
            {!changesLoading && !changes?.length && <p className="text-sm text-gray-500">No profile changes recorded.</p>}
            <div className="space-y-3">{changes?.map((change) => <div key={change.id} className="rounded-lg border border-gray-100 p-3"><p className="text-xs font-semibold text-gray-400">{new Date(change.changedAt).toLocaleString()}</p><p className="mt-1 text-sm text-togt-navy"><b>{change.fieldName}</b> changed: <span className="text-gray-500">{change.oldValue || "empty"}</span> → <span className="font-medium">{change.newValue || "empty"}</span></p></div>)}</div>
          </div>
        </div>
      )}
      {infoUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold text-togt-navy">User Information</h2><p className="text-sm text-gray-500">{info?.fullName ?? infoUser.fullName}</p></div><Button variant="ghost" size="icon" onClick={() => setInfoUser(null)}><X className="h-4 w-4" /></Button></div>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">{[["Full name", info?.fullName], ["Email", info?.email], ["Role", info?.role], ["Status", info?.status], ["Joined", info?.createdAt && new Date(info.createdAt).toLocaleString()], ["Phone", info?.phone], ["Birthday", info?.birthday && new Date(info.birthday).toLocaleDateString()], ["Nationality", info?.nationality], ["Address", info?.address], ["Passport", info?.passportNumber], ["Passport issue", info?.passportIssueDate && new Date(info.passportIssueDate).toLocaleDateString()], ["Passport expiry", info?.passportExpiry && new Date(info.passportExpiry).toLocaleDateString()]].map(([label, value]) => <div key={label}><dt className="text-gray-400">{label}</dt><dd className="font-medium text-togt-navy">{value || "Not provided"}</dd></div>)}</div>
            <h3 className="mt-6 border-t pt-4 text-sm font-bold uppercase tracking-wide text-gray-400">Activity</h3><div className="mt-2 grid grid-cols-3 gap-3 text-center text-sm"><div className="rounded-lg bg-slate-50 p-3"><b>{(info as User & { _count?: { serviceRequests: number } })?._count?.serviceRequests ?? "-"}</b><p className="text-xs text-gray-400">Requests</p></div><div className="rounded-lg bg-slate-50 p-3"><b>{(info as User & { _count?: { tickets: number } })?._count?.tickets ?? "-"}</b><p className="text-xs text-gray-400">Tickets</p></div><div className="rounded-lg bg-slate-50 p-3"><b>{(info as User & { _count?: { groupMembers: number } })?._count?.groupMembers ?? "-"}</b><p className="text-xs text-gray-400">Groups</p></div></div>
          </div>
        </div>
      )}
      {requestsUser && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-togt-navy">User Requests - {requestsUser.fullName}</h2><p className="text-sm text-gray-500">{userRequests?.total ?? 0} total</p></div><Button variant="ghost" onClick={() => setRequestsUser(null)}>Close</Button></div><div className="space-y-3">{userRequests?.data.map((request) => <div key={request.id} className="rounded-lg border border-gray-100 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><b>{request.serviceType.replace(/_/g, " ")}</b><span><StatusBadge value={request.status} /> <StatusBadge value={request.paymentStatus} /></span></div><p className="mt-2 text-sm text-gray-500">{request.amount ? `${request.amount.toLocaleString()} ${request.currency}` : "Amount pending"} · {new Date(request.createdAt).toLocaleString()}</p></div>)}</div>{userRequests && <div className="mt-4 border-t pt-4 text-sm text-gray-600">Paid: {userRequests.data.filter((request) => request.paymentStatus === "PAID").length} · Unpaid: {userRequests.data.filter((request) => request.paymentStatus === "UNPAID").length}</div>}</div></div>}
    </div>
  );
}
