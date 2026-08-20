"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Search } from "lucide-react";
import { useGroups, useGroupMutations } from "@/hooks/useGroups";
import { PageHeader } from "../shared/page-header";
import { StatusBadge } from "../shared/status-badge";
import { LoadingSpinner } from "../shared/loading-spinner";
import { EmptyState } from "../shared/empty-state";

export function AdminGroupsTab() {
  const { data: groups, isLoading } = useGroups();
  const { toggleHidden } = useGroupMutations();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [hidden, setHidden] = useState("");
  const visible = useMemo(() => (groups ?? []).filter((group) => (!search || `${group.name} ${group.members.map((member) => member.user?.fullName).join(" ")}`.toLowerCase().includes(search.toLowerCase())) && (!status || group.status === status) && (!hidden || hidden === "all" || (hidden === "hidden" ? group.isHidden : !group.isHidden))), [groups, search, status, hidden]);
  if (isLoading) return <LoadingSpinner label="Loading all groups..." />;
  return <div><PageHeader title="All Groups" description="Admin oversight, visibility controls, members, and progress" /><div className="mb-4 flex flex-wrap gap-2"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search group or member" className="h-8 w-full rounded-lg border border-input pl-8 text-sm" /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-8 rounded-lg border border-input px-2 text-sm"><option value="">All statuses</option><option>UPCOMING</option><option>IN_PROGRESS</option><option>COMPLETED</option><option>CANCELLED</option></select><select value={hidden} onChange={(event) => setHidden(event.target.value)} className="h-8 rounded-lg border border-input px-2 text-sm"><option value="">All visibility</option><option value="visible">Visible</option><option value="hidden">Hidden</option></select></div>{visible.length ? <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{visible.map((group) => <div key={group.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex justify-between"><h3 className="font-bold text-togt-navy">{group.name}</h3><StatusBadge value={group.status} /></div><p className="mt-2 text-sm text-gray-500">{group.members.length} members · {group.members.filter((member) => member.role === "GUIDE").length} guides</p>{group.isHidden && <p className="mt-2 text-xs font-semibold text-red-600">Hidden from workers</p>}<button onClick={() => toggleHidden.mutate({ id: group.id, isHidden: !group.isHidden })} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-togt-navy">{group.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}{group.isHidden ? "Unhide" : "Hide"} group</button></div>)}</div> : <EmptyState title="No groups found" description="Adjust your search or filters." />}</div>;
}
