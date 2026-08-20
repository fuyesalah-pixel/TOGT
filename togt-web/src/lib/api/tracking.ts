import { apiGet } from "./client";

export interface ParentTrackingResult {
  memberId: string;
  memberName: string;
  phone?: string | null;
  groupId: string;
  groupName: string;
  guideLocation?: { latitude: number; longitude: number; name?: string } | null;
  memberLocation?: { latitude: number; longitude: number } | null;
  distance: number;
  status: "SAFE" | "WARNING" | "DANGER" | "OFFLINE";
  lastUpdated?: string | null;
}
export function searchTrackingMember(query: string) { return apiGet<ParentTrackingResult>(`/tracking/search?query=${encodeURIComponent(query)}&t=${Date.now()}`); }
