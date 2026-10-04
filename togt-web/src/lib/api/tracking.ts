import { apiDelete, apiGet, apiPost } from "./client";

/** Live position of one traveler (accepted consent + active group). */
export interface TrackableMember {
  memberId: string;
  memberName: string;
  phone?: string | null;
  groupId: string;
  groupName: string;
  guideLocation?: { latitude: number; longitude: number; name?: string } | null;
  memberLocation?: { latitude: number; longitude: number } | null;
  distance: number | null;
  status: "SAFE" | "WARNING" | "DANGER" | "OFFLINE" | "UNKNOWN";
  lastUpdated?: string | null;
}

export type ConsentState = "NONE" | "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";

/** A customer returned by /tracking/people with the current consent state. */
export interface TrackablePerson {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  travelingNow: boolean;
  groupName?: string | null;
  consent: ConsentState;
}

export interface TrackingRequestRow {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  direction: "sent" | "received";
  user: { id: string; fullName: string; email: string };
  respondedAt?: string | null;
  createdAt: string;
}

export interface TrackingRequests {
  sent: TrackingRequestRow[];
  received: TrackingRequestRow[];
}

export function searchTrackingMembers(query: string) {
  return apiGet<TrackableMember[]>(`/tracking/search?query=${encodeURIComponent(query)}&t=${Date.now()}`);
}

export function searchTrackingPeople(query: string) {
  return apiGet<TrackablePerson[]>(`/tracking/people?query=${encodeURIComponent(query)}`);
}

export function listTrackingRequests() {
  return apiGet<TrackingRequests>("/tracking/requests");
}

export function sendTrackingRequest(targetId: string) {
  return apiPost<{ id: string; targetId: string; status: string; targetName: string }>("/tracking/requests", { targetId });
}

export function respondTrackingRequest(id: string, accept: boolean) {
  return apiPost<TrackingRequestRow>(`/tracking/requests/${id}/${accept ? "accept" : "decline"}`);
}

export function cancelTrackingRequest(id: string) {
  return apiDelete<TrackingRequestRow>(`/tracking/requests/${id}`);
}
