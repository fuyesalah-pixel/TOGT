"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatSocket } from "./useChat";
import {
  addGroupMembers,
  createGroup,
  listGroups,
  updateGroup,
  getGroupPlan, createPlanStep, updatePlanStep, updateGuideAssignment, updatePlanConfirmation, removeGroupMember, getGroupLocations, toggleGroupHidden,
  type CreateGroupPayload,
  type UpdateGroupPayload,
} from "@/lib/api/groups";
import type { MemberRole } from "@/lib/api/types";

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: listGroups,
  });
}

export function useGroupMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["groups"] });

  const create = useMutation({
    mutationFn: (dto: CreateGroupPayload) => createGroup(dto),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGroupPayload }) => updateGroup(id, dto),
    onSuccess: invalidate,
  });
  const toggleHidden = useMutation({ mutationFn: ({ id, isHidden }: { id: string; isHidden: boolean }) => toggleGroupHidden(id, isHidden), onSuccess: invalidate });
  const addMembers = useMutation({
    mutationFn: ({ id, userIds, role }: { id: string; userIds: string[]; role?: MemberRole }) =>
      addGroupMembers(id, { userIds, role }),
    onSuccess: invalidate,
  });

  const acceptAssignment = useMutation({ mutationFn: ({ id, status }: { id: string; status: "ACCEPTED" | "DECLINED" }) => updateGuideAssignment(id, status), onSuccess: invalidate });
  const addPlanStep = useMutation({ mutationFn: ({ id, title, description, location, estimatedAt, priority }: { id: string; title: string; description?: string; location?: string; estimatedAt?: string; priority?: string }) => createPlanStep(id, { title, description, location, estimatedAt, priority }), onSuccess: invalidate });
  const updatePlan = useMutation({ mutationFn: ({ id, stepId, status, notes, actualAt }: { id: string; stepId: string; status?: string; notes?: string; actualAt?: string }) => updatePlanStep(id, stepId, { status, notes, actualAt }), onSuccess: invalidate });
  const confirmPlan = useMutation({ mutationFn: ({ id, stepId, status, reason }: { id: string; stepId: string; status: "CONFIRMED" | "REJECTED"; reason?: string }) => updatePlanConfirmation(id, stepId, { status, reason }), onSuccess: invalidate });
  const removeMember = useMutation({ mutationFn: ({ id, userId }: { id: string; userId: string }) => removeGroupMember(id, userId), onSuccess: invalidate });
  return { createGroup: create, updateGroup: update, addGroupMembers: addMembers, acceptAssignment, addPlanStep, updatePlan, confirmPlan, removeMember, toggleHidden };
}

export function useGroupPlan(id?: string) { return useQuery({ queryKey: ["groups", id, "plan"], queryFn: () => getGroupPlan(id as string), enabled: !!id }); }
export function useGroupLocations(id?: string) {
  const queryClient = useQueryClient();
  const socket = useChatSocket();
  const query = useQuery({ queryKey: ["groups", id, "locations"], queryFn: () => getGroupLocations(id as string), enabled: !!id, refetchInterval: 45_000 });
  useEffect(() => { if (!socket || !id) return; const refresh = (payload: { groupId?: string }) => { if (payload.groupId === id) queryClient.invalidateQueries({ queryKey: ["groups", id, "locations"] }); }; socket.on("memberLocationUpdate", refresh); socket.on("geofenceAlarm", refresh); return () => { socket.off("memberLocationUpdate", refresh); socket.off("geofenceAlarm", refresh); }; }, [socket, id, queryClient]);
  return query;
}
