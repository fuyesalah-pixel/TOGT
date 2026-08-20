"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import type { Role, ServiceType, Status, User } from "@/lib/api/types";
import { DataTable } from "../shared/data-table";
import { PageHeader } from "../shared/page-header";
import { Pagination } from "../shared/pagination";
import { SearchInput } from "../shared/search-input";
import { StatusBadge } from "../shared/status-badge";
import { UserDetailDialog } from "./user-detail-dialog";

const ROLES: Role[] = ["CUSTOMER", "WORKER", "GUIDE", "ADMIN", "TECH"];
const STATUSES: Status[] = ["ACTIVE", "TERMINATED"];
const SERVICE_TYPES: ServiceType[] = [
  "TICKET",
  "UMRAH",
  "DOMESTIC",
  "TOURIST",
  "VISA",
  "CONSULTING",
  "FOREIGN_TRAVEL",
];

export function UsersTab() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data, isLoading } = useUsers({
    search: search || undefined,
    role: role || undefined,
    status: status || undefined,
    serviceType: serviceType || undefined,
    page,
    limit: 15,
  });

  return (
    <div>
      <PageHeader
        title="Users"
        description="Search and manage all registered users. Admin accounts cannot be modified here."
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Name, email or phone..." />
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value as Role | ""); setPage(1); }}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as Status | ""); setPage(1); }}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={serviceType}
          onChange={(e) => { setServiceType(e.target.value as ServiceType | ""); setPage(1); }}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">All service types</option>
          {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <DataTable<User>
          isLoading={isLoading}
          rows={data?.data ?? []}
          emptyTitle="No users found"
          emptyDescription="Try adjusting your search or filters."
          onRowClick={setSelectedUser}
          columns={[
            { key: "fullName", label: "Name", render: (u) => <span className="font-semibold">{u.fullName}</span> },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone", render: (u) => u.phone ?? "—" },
            { key: "role", label: "Role", render: (u) => <StatusBadge value={u.role} /> },
            { key: "status", label: "Status", render: (u) => <StatusBadge value={u.status} /> },
            { key: "createdAt", label: "Joined", render: (u) => new Date(u.createdAt).toLocaleDateString() },
          ]}
        />
        {data && (
          <div className="px-3 pb-3">
            <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <UserDetailDialog
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
