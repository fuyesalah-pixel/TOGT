import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { Group, GroupLocation, GroupStatus, MemberRole, TourPlanStep } from "./types";

export function listGroups(): Promise<Group[]> {
  return apiGet<Group[]>("/groups");
}

export interface CreateGroupPayload {
  name: string;
  packageId?: string;
  startDate: string;
  endDate: string;
}

export function createGroup(dto: CreateGroupPayload): Promise<Group> {
  return apiPost<Group>("/groups", dto);
}

export interface UpdateGroupPayload {
  name?: string;
  packageId?: string;
  startDate?: string;
  endDate?: string;
  status?: GroupStatus;
}

export function updateGroup(id: string, dto: UpdateGroupPayload): Promise<Group> {
  return apiPatch<Group>(`/groups/${id}`, dto);
}
export function toggleGroupHidden(id: string, isHidden: boolean): Promise<Group> { return apiPatch<Group>(`/groups/${id}/toggle-hidden`, { isHidden }); }

export function addGroupMembers(
  id: string,
  dto: { userIds: string[]; role?: MemberRole },
): Promise<Group> {
  return apiPost<Group>(`/groups/${id}/members`, dto);
}
export function removeGroupMember(groupId: string, userId: string) { return apiDelete(`/groups/${groupId}/members/${userId}`); }
export function getGroupLocations(groupId: string): Promise<GroupLocation[]> { return apiGet<GroupLocation[]>(`/groups/${groupId}/locations?t=${Date.now()}`); }
export interface GroupLocationCenter { latitude: number; longitude: number; locationName: string; updatedAt?: string | null }
export function getGroupLocation(groupId: string): Promise<GroupLocationCenter | null> { return apiGet<GroupLocationCenter | null>(`/groups/${groupId}/location?t=${Date.now()}`); }
export function postGroupLocation(groupId: string, dto: { latitude: number; longitude: number; accuracy?: number }) { return apiPost(`/groups/${groupId}/location`, dto); }
export function alertGroup(groupId: string, dto: { type: "URGENT" | "INFO" | "WARNING"; message: string }) { return apiPost<{ sent: number }>(`/groups/${groupId}/alert`, dto); }

export function getGroupPlan(id: string): Promise<TourPlanStep[]> { return apiGet<TourPlanStep[]>(`/groups/${id}/plan`); }
export function createPlanStep(id: string, dto: { title: string; description?: string; location?: string; estimatedAt?: string; priority?: string }): Promise<TourPlanStep> { return apiPost<TourPlanStep>(`/groups/${id}/plan`, dto); }
export function updatePlanStep(id: string, stepId: string, dto: { status?: string; notes?: string; actualAt?: string }): Promise<TourPlanStep> { return apiPatch<TourPlanStep>(`/groups/${id}/plan/${stepId}`, dto); }
export function updatePlanConfirmation(id: string, stepId: string, dto: { status: "CONFIRMED" | "REJECTED"; reason?: string }): Promise<TourPlanStep> { return apiPatch<TourPlanStep>(`/groups/${id}/plan/${stepId}/confirmation`, dto); }
export function updateGuideAssignment(id: string, status: "ACCEPTED" | "DECLINED"): Promise<unknown> { return apiPatch(`/groups/${id}/assignment`, { status }); }
