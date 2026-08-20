"use client";

import { Calendar, Users } from "lucide-react";
import { useGroups } from "@/hooks/useGroups";
import { useAuth } from "@/hooks/useAuth";
import { useGroupMutations } from "@/hooks/useGroups";
import { PageHeader } from "../shared/page-header";
import { StatusBadge } from "../shared/status-badge";
import { LoadingSpinner } from "../shared/loading-spinner";
import { EmptyState } from "../shared/empty-state";
import { MemberRoleAvatar, MemberRoleLabel } from "../shared/member-role-avatar";
import { GroupProgress } from "../shared/group-progress";

export function GroupsTab() {
  const { data: groups, isLoading } = useGroups();
  const { user } = useAuth();
  const { acceptAssignment } = useGroupMutations();

  if (isLoading) return <LoadingSpinner label="Loading your groups..." />;

  return (
    <div>
      <PageHeader title="My Groups" description="Groups you are assigned to guide" />

      {!groups || groups.length === 0 ? (
        <EmptyState
          title="No assigned groups"
          description="When a worker assigns you as a guide, the group will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <div key={group.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-togt-navy">{group.name}</h3>
                <StatusBadge value={group.status} />
              </div>
              {user && group.members.some((member) => member.userId === user.id && member.role === "GUIDE" && member.assignmentStatus === "PENDING") && <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><span>New guide assignment</span><span className="flex gap-2"><button onClick={() => acceptAssignment.mutate({ id: group.id, status: "DECLINED" })} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs">Decline</button><button onClick={() => acceptAssignment.mutate({ id: group.id, status: "ACCEPTED" })} className="rounded-lg bg-togt-blue px-2 py-1 text-xs text-white">Accept</button></span></div>}
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(group.startDate).toLocaleDateString()} → {new Date(group.endDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {group.members.length} member{group.members.length === 1 ? "" : "s"}
                </span>
              </div>
              <GroupProgress groupId={group.id} />
              <div className="mt-4 border-t border-gray-50 pt-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Members</p>
                <div className="space-y-1.5">
                  {group.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-3"><MemberRoleAvatar role={m.role} self={m.userId === user?.id} /><span><span className="block text-togt-navy">{m.user?.fullName ?? "Member"}</span><MemberRoleLabel role={m.role} self={m.userId === user?.id} /></span></span>
                      <span className="flex items-center gap-2"><StatusBadge value={m.role} />{m.role === "GUIDE" && m.assignmentStatus && <StatusBadge value={m.assignmentStatus} />}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
