"use client";

import { useEffect, useState } from "react";
import { MapPin, Map as MapIcon, RefreshCw, Target } from "lucide-react";
import { useGroups, useGroupLocations } from "@/hooks/useGroups";
import { useGroupLocationPublisher } from "@/hooks/useGroupLocationPublisher";
import { useChatSocket } from "@/hooks/useChat";
import { getGroupLocation } from "@/lib/api/groups";
import { GuideMap } from "./guide-map";
import { PageHeader } from "../shared/page-header";
import { LoadingSpinner } from "../shared/loading-spinner";
import { EmptyState } from "../shared/empty-state";
import { Button } from "@/components/ui/button";
export { GuideOverviewTab, GuidePlansTab } from "./guide-tabs-old";

export function GuideTrackingTab() {
  const { data: groups, isLoading } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string>();
  const selectedGroup = groups?.find((group) => group.id === selectedGroupId) ?? groups?.find((group) => group.status === "IN_PROGRESS") ?? groups?.[0];
  const groupId = selectedGroup?.id;
  const { data: locations, refetch } = useGroupLocations(groupId);
  const { error: gpsError, lastSentAt } = useGroupLocationPublisher(groupId, selectedGroup?.status === "IN_PROGRESS");
  const socket = useChatSocket();
  const [alarm, setAlarm] = useState<{ memberName: string; distanceMeters: number } | null>(null);
  const [routeMode, setRouteMode] = useState<"all" | "one">("all");
  const [memberId, setMemberId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("Last refreshed: not yet");
  useEffect(() => { if (!socket) return; const onAlarm = (payload: { memberName: string; distanceMeters: number }) => setAlarm(payload); const onResolved = () => setAlarm(null); socket.on("geofenceAlarm", onAlarm); socket.on("geofenceResolved", onResolved); return () => { socket.off("geofenceAlarm", onAlarm); socket.off("geofenceResolved", onResolved); }; }, [socket]);
  if (isLoading) return <LoadingSpinner label="Loading member tracking..." />;
  const members = selectedGroup?.members.filter((member) => member.role === "MEMBER") ?? [];
  const points = (locations ?? []).map((location) => ({ id: location.user.id, name: location.user.fullName, latitude: location.latitude, longitude: location.longitude, distanceMeters: location.distanceMeters, createdAt: location.createdAt, role: location.role }));
  const refresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); setMessage("Refreshed - just now"); };
  const locate = async () => { if (!groupId) return; const location = await getGroupLocation(groupId); setMessage(location ? `At ${location.locationName}` : "Group location unavailable"); };
  return <div>
    <PageHeader title="GPS Tracking" description="Member safety panel for the selected group" />
    {groups && groups.length > 1 && <select value={selectedGroup?.id ?? ""} onChange={(event) => { setSelectedGroupId(event.target.value); setMemberId(""); setRouteMode("all"); }} className="mb-3 h-9 rounded-lg border border-input bg-white px-3 text-sm">{groups.map((group) => <option key={group.id} value={group.id}>{group.name} - {group.status} - {group.members.length} members</option>)}</select>}
    {alarm && <div className="mb-3 animate-pulse rounded-xl border-2 border-red-500 bg-red-50 p-3 font-bold text-red-700">Geofence alarm: {alarm.memberName} is {(alarm.distanceMeters / 1000).toFixed(1)}km from the guide.</div>}
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><MapPin className="mr-2 inline h-4 w-4" />{gpsError ?? (selectedGroup?.status === "IN_PROGRESS" ? `GPS sharing active. Last sent: ${lastSentAt ? new Date(lastSentAt).toLocaleTimeString() : "waiting"}.` : `Map locked while group status is ${selectedGroup?.status ?? "UPCOMING"}.`)}</div>
    <GuideMap groupId={groupId} locked={selectedGroup?.status !== "IN_PROGRESS"} routeMode={routeMode} focusMemberId={memberId} lockMessage={`Group status: ${selectedGroup?.status ?? "UPCOMING"}.`} points={points} />
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"><Button variant="outline" disabled={selectedGroup?.status !== "IN_PROGRESS"} onClick={locate}><MapIcon className="mr-1 h-4 w-4" />Go to Group Location</Button><Button variant="outline" disabled={refreshing || selectedGroup?.status !== "IN_PROGRESS"} onClick={refresh}><RefreshCw className={`mr-1 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "Refreshing..." : "Refresh"}</Button><Button variant="outline" disabled={refreshing || selectedGroup?.status !== "IN_PROGRESS"} onClick={async () => { await refresh(); setRouteMode("all"); }}><MapIcon className="mr-1 h-4 w-4" />Nav All</Button><select value={memberId} onChange={(event) => setMemberId(event.target.value)} className="h-9 min-w-48 rounded-lg border border-input px-2 text-sm"><option value="">Select member</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.user?.fullName}</option>)}</select><Button disabled={!memberId || refreshing || selectedGroup?.status !== "IN_PROGRESS"} onClick={async () => { await refresh(); setRouteMode("one"); }}><Target className="mr-1 h-4 w-4" />Nav One</Button><span className="text-xs text-gray-500">{message}</span></div>
    <div className="mt-4 rounded-xl border border-gray-100 bg-white shadow-sm"><div className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase text-gray-400">Members Distance from Guide</div>{members.length ? members.map((member) => { const location = locations?.find((item) => item.user.id === member.userId); return <div key={member.userId} className="flex items-center justify-between border-b border-gray-50 px-4 py-3 text-sm"><span className="font-semibold text-togt-navy">{member.user?.fullName}</span><span>{location ? `${Math.round(location.distanceMeters)}m` : "Device location unavailable"}</span></div>; }) : <EmptyState title="No members" description="This group has no members." />}</div>
  </div>;
}
