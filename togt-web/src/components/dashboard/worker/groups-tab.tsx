"use client";

import { useState } from "react";
import { Calendar, Users } from "lucide-react";
import { useGroups, useGroupLocations, useGroupMutations, useGroupPlan } from "@/hooks/useGroups";
import { useUsers } from "@/hooks/useUsers";
import { GuideMap } from "../guide/guide-map";
import { PageHeader } from "../shared/page-header";
import { StatusBadge } from "../shared/status-badge";
import { LoadingSpinner } from "../shared/loading-spinner";
import { EmptyState } from "../shared/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GroupProgress } from "../shared/group-progress";
import { MemberRoleAvatar, MemberRoleLabel } from "../shared/member-role-avatar";

export function WorkerGroupsTab() {
  const { data: groups, isLoading } = useGroups();
  const { addPlanStep, removeMember, addGroupMembers } = useGroupMutations();
  const [selectedId, setSelectedId] = useState<string>();
  const [detailTab, setDetailTab] = useState<"overview" | "members" | "orders" | "tracking">("overview");
  const [title, setTitle] = useState("");
  const [estimatedAt, setEstimatedAt] = useState("");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberRoleFilter, setMemberRoleFilter] = useState<"ALL" | "MEMBER" | "GUIDE">("ALL");
  const selected = groups?.find((group) => group.id === selectedId);
  const { data: plan } = useGroupPlan(selectedId);
  const { data: locations } = useGroupLocations(detailTab === "tracking" ? selectedId : undefined);
  const { data: users } = useUsers({ role: "CUSTOMER", search: memberSearch || undefined, limit: 100 });

  if (isLoading) return <LoadingSpinner label="Loading groups..." />;

  return <div>
    <PageHeader title="Groups" description="Manage group members, guide assignments, orders, and tracking" />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-3">
        {groups?.map((group) => <button key={group.id} onClick={() => { setSelectedId(group.id); setDetailTab("overview"); }} className={`w-full rounded-xl border p-4 text-left shadow-sm ${selectedId === group.id ? "border-togt-orange bg-togt-orange/5" : "border-gray-100 bg-white"}`}>
          <div className="flex justify-between gap-2"><p className="font-bold text-togt-navy">{group.name}</p><StatusBadge value={group.status} /></div>
          <p className="mt-2 flex items-center gap-2 text-xs text-gray-500"><Calendar className="h-3.5 w-3.5" />{new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-gray-500"><Users className="h-3.5 w-3.5" />{group.members.filter((member) => member.role === "MEMBER").length} members · {group.members.filter((member) => member.role === "GUIDE").length} guides</p>
          <GroupProgress groupId={group.id} />
        </button>)}
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
        {!selected ? <EmptyState title="Select a group" description="Open a group to review members, guide responses, orders, and tracking." /> : <>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-togt-navy">{selected.name}</h2><p className="text-xs text-gray-500">{selected.members.length} members · {selected.members.filter((member) => member.role === "GUIDE").length} guides</p></div><div className="flex gap-1">{(["overview", "members", "orders", "tracking"] as const).map((tab) => <button key={tab} onClick={() => setDetailTab(tab)} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${detailTab === tab ? "bg-togt-orange text-white" : "bg-slate-100 text-gray-500"}`}>{tab}</button>)}</div></div>
          {detailTab === "overview" && <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-gray-400">Group status</p><StatusBadge value={selected.status} /></div><div className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-gray-400">Orders completed</p><p className="text-xl font-bold text-togt-navy">{plan?.filter((step) => step.status === "COMPLETED").length ?? 0}/{plan?.length ?? 0}</p></div></div>}
          {detailTab === "members" && <div className="mt-5 space-y-2"><div className="flex items-center justify-between gap-2"><select value={memberRoleFilter} onChange={(event) => setMemberRoleFilter(event.target.value as typeof memberRoleFilter)} className="h-8 rounded-lg border border-input px-2.5 text-sm"><option value="ALL">All roles</option><option value="MEMBER">Members only</option><option value="GUIDE">Guides only</option></select><Button onClick={() => setAddMemberOpen(true)} className="bg-togt-blue text-white">+ Add Member</Button></div>{selected.members.filter((member) => memberRoleFilter === "ALL" || member.role === memberRoleFilter).map((member) => <div key={member.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3"><div className="flex items-center gap-3"><MemberRoleAvatar role={member.role} /><span><span className="block font-semibold text-togt-navy">{member.user?.fullName}</span><MemberRoleLabel role={member.role} /><span className="block text-xs text-gray-500">{member.user?.phone ?? "No phone"} · {member.user?.passportNumber ?? "No passport"}</span></span></div><button onClick={() => removeMember.mutate({ id: selected.id, userId: member.userId })} className="text-xs font-semibold text-red-600">Remove</button></div>)}</div>}
          {detailTab === "tracking" && <div className="mt-5"><GuideMap locked={selected?.status !== "IN_PROGRESS"} lockMessage={`Group status: ${selected?.status ?? "UPCOMING"}.`} points={(locations ?? []).map((location) => ({ id: location.user.id, name: location.user.fullName, latitude: location.latitude, longitude: location.longitude, distanceMeters: location.distanceMeters, createdAt: location.createdAt, role: location.role }))} /><div className="mt-3 space-y-2">{locations?.length ? locations.map((location) => <div key={location.user.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm"><span className="font-semibold text-togt-navy">{location.user.fullName}</span><span className={location.role === "GUIDE" ? "text-togt-blue" : location.distanceMeters > 1000 ? "text-red-600" : location.distanceMeters > 500 ? "text-amber-600" : "text-emerald-600"}>{location.role === "GUIDE" ? "Guide" : `${Math.round(location.distanceMeters)}m from guide`}</span></div>) : <p className="text-sm text-gray-500">Device location not available.</p>}</div></div>}
          {detailTab === "orders" && <div className="mt-5"><div className="flex flex-wrap gap-2"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="New order title" className="h-8 flex-1 rounded-lg border border-input px-2.5 text-sm" /><input type="datetime-local" value={estimatedAt} onChange={(event) => setEstimatedAt(event.target.value)} className="h-8 rounded-lg border border-input px-2.5 text-sm" /><button disabled={!title.trim() || addPlanStep.isPending} onClick={() => { addPlanStep.mutate({ id: selected.id, title: title.trim(), estimatedAt: estimatedAt || undefined }); setTitle(""); setEstimatedAt(""); }} className="rounded-lg bg-togt-blue px-3 py-1.5 text-xs font-semibold text-white">Add order</button></div><div className="mt-4 space-y-3">{plan?.map((step) => <div key={step.id} className="rounded-lg border border-gray-100 p-3"><div className="flex items-center justify-between"><p className="font-semibold text-togt-navy">{step.title}</p><StatusBadge value={step.confirmationStatus ?? "PENDING"} /></div><p className="mt-1 text-xs text-gray-500">Order status: {step.status}</p>{step.rejectedReason && <p className="mt-1 text-xs text-red-600">Rejection: {step.rejectedReason}</p>}</div>)}</div></div>}
        </>}
      </div>
      <Dialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)} title={`Add Members to ${selected?.name ?? "Group"}`} size="md">
        <div className="space-y-3">
          <Input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Search customers by name or email..." />
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-2">
            {(users?.data ?? []).map((candidate) => {
              const alreadyAdded = Boolean(selected?.members.some((member) => member.userId === candidate.id));
              const checked = alreadyAdded || selectedMemberIds.includes(candidate.id);
              return <label key={candidate.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${alreadyAdded ? "cursor-not-allowed bg-slate-50 opacity-60" : "cursor-pointer hover:bg-slate-50"}`}><input type="checkbox" checked={checked} disabled={alreadyAdded} onChange={() => setSelectedMemberIds((current) => checked ? current.filter((id) => id !== candidate.id) : [...current, candidate.id])} /><MemberRoleAvatar role={candidate.role === "GUIDE" ? "GUIDE" : "MEMBER"} /><span><span className="block font-semibold text-togt-navy">{candidate.fullName}</span><MemberRoleLabel role={candidate.role === "GUIDE" ? "GUIDE" : "MEMBER"} /><span className="block text-xs text-gray-500">{candidate.email}</span></span>{alreadyAdded && <span className="ml-auto text-[11px] font-semibold text-gray-400">Already added</span>}</label>;
            })}
          </div>
          <p className="text-xs text-gray-500">Selected: {selectedMemberIds.length}</p>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button><Button disabled={!selectedMemberIds.length || !selected || addGroupMembers.isPending} onClick={() => { if (!selected) return; addGroupMembers.mutate({ id: selected.id, userIds: selectedMemberIds, role: "MEMBER" }, { onSuccess: () => { setSelectedMemberIds([]); setMemberSearch(""); setAddMemberOpen(false); } }); }} className="bg-togt-blue text-white">{addGroupMembers.isPending ? "Adding..." : "Add selected"}</Button></div>
        </div>
      </Dialog>
    </div>
  </div>;
}
