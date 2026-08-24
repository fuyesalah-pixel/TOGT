"use client";

import { useEffect, useState } from "react";
import { Activity, Calendar, CheckCircle2, MapPin, TriangleAlert, Users, RefreshCw, Map as MapIcon, Target } from "lucide-react";
import { useGroups, useGroupLocations, useGroupMutations, useGroupPlan } from "@/hooks/useGroups";
import { PageHeader } from "../shared/page-header";
import { StatCard } from "../shared/stat-card";
import { StatusBadge } from "../shared/status-badge";
import { LoadingSpinner } from "../shared/loading-spinner";
import { EmptyState } from "../shared/empty-state";
import { Button } from "@/components/ui/button";
import { GuideMap } from "./guide-map";
import { useGroupLocationPublisher } from "@/hooks/useGroupLocationPublisher";
import { useChatSocket } from "@/hooks/useChat";
import { getGroupLocation } from "@/lib/api/groups";

export function GuideOverviewTab() {
  const { data: groups, isLoading } = useGroups();
  if (isLoading) return <LoadingSpinner label="Loading guide overview..." />;
  const active = groups?.filter((group) => group.status === "IN_PROGRESS").length ?? 0;
  const members = groups?.reduce((total, group) => total + group.members.filter((member) => member.role === "MEMBER").length, 0) ?? 0;
  return <div><PageHeader title="Guide Overview" description="Your groups, members, and schedule" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><StatCard label="Active Groups" value={active} icon={Users} accent="blue" /><StatCard label="Total Members" value={members} icon={Users} accent="orange" /><StatCard label="Upcoming Groups" value={groups?.filter((group) => group.status === "UPCOMING").length ?? 0} icon={Calendar} accent="navy" /><StatCard label="Alerts Today" value={0} icon={Activity} accent="red" /></div><div className="mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-togt-navy">Today&apos;s schedule</h2><p className="mt-2 text-sm text-gray-500">Open Tour Plans to review the next steps for each assigned group.</p></div></div>;
}

export function GuideTrackingTab() {
  const { data: groups, isLoading } = useGroups();
  const activeGroupId = groups?.find((group) => group.status === "IN_PROGRESS")?.id ?? groups?.[0]?.id;
  const activeGroup = groups?.find((group) => group.id === activeGroupId);
  const { data: locations, refetch } = useGroupLocations(activeGroupId);
  const { error: gpsError, lastSentAt } = useGroupLocationPublisher(activeGroupId, activeGroup?.status === "IN_PROGRESS");
  const socket = useChatSocket();
  const [alarm, setAlarm] = useState<{ memberName: string; distanceMeters: number } | null>(null);
  const [routeMode, setRouteMode] = useState<"all" | "one" | "none">("all");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [controlMessage, setControlMessage] = useState("Last refreshed: not yet");
  const [flyTo, setFlyTo] = useState<{ longitude: number; latitude: number; nonce: number }>();
  const [locating, setLocating] = useState(false);
  useEffect(() => { if (routeMode !== "one" || !activeGroupId) return; const timer = window.setInterval(() => { void refetch(); }, 5_000); return () => window.clearInterval(timer); }, [routeMode, activeGroupId, refetch]);
  useEffect(() => { if (!socket) return; const onAlarm = (payload: { memberName: string; distanceMeters: number }) => { setAlarm(payload); if (navigator.vibrate) navigator.vibrate([300, 150, 300]); if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("Geofence alarm", { body: `${payload.memberName} is ${Math.round(payload.distanceMeters)}m from the guide.` }); }; const onResolved = () => setAlarm(null); socket.on("geofenceAlarm", onAlarm); socket.on("geofenceResolved", onResolved); return () => { socket.off("geofenceAlarm", onAlarm); socket.off("geofenceResolved", onResolved); }; }, [socket]);
  if (isLoading) return <LoadingSpinner label="Loading member tracking..." />;
  const members = activeGroup?.members.filter((member) => member.role === "MEMBER").map((member) => ({ ...member, groupName: activeGroup.name })) ?? [];
  const current = activeGroup?.status === "IN_PROGRESS";
  const memberPoints = (locations ?? []).filter((location) => location.role !== "GUIDE");
  const refreshLocations = async () => { setRefreshing(true); await refetch(); setRefreshing(false); setControlMessage("Refreshed - just now"); };
  const navigateAll = async () => { setRefreshing(true); await refetch(); setRouteMode("all"); setRefreshing(false); setControlMessage("Routes shown - just now"); };
  const navigateOne = async () => { if (!selectedMemberId) return; setRefreshing(true); await refetch(); setRouteMode("one"); setRefreshing(false); setControlMessage(`Following ${memberPoints.find((member) => member.user.id === selectedMemberId)?.user.fullName ?? "member"}`); };
  const goToGroupLocation = async () => { if (!activeGroupId) return; setLocating(true); const location = await getGroupLocation(activeGroupId); setLocating(false); if (!location) { setControlMessage("Group location unavailable"); return; } setFlyTo({ longitude: location.longitude, latitude: location.latitude, nonce: Date.now() }); setControlMessage(`At ${location.locationName}`); };
  void flyTo; void locating; void goToGroupLocation;
  return <div><PageHeader title="GPS Tracking" description="Member safety panel for your assigned groups" />{alarm && <div className="mb-4 animate-pulse rounded-xl border-2 border-red-500 bg-red-50 p-4 font-bold text-red-700">Geofence alarm: {alarm.memberName} is {(alarm.distanceMeters / 1000).toFixed(1)}km from the guide.</div>}<div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><MapPin className="mr-2 inline h-4 w-4" />{gpsError ?? (current ? `GPS sharing active. Last sent: ${lastSentAt ? new Date(lastSentAt).toLocaleTimeString() : "waiting"}.` : `Map locked while group status is ${activeGroup?.status ?? "UPCOMING"}.`)}</div><GuideMap locked={!current} routeMode={routeMode} focusMemberId={selectedMemberId} lockMessage={`Group status: ${activeGroup?.status ?? "UPCOMING"}. Tracking unlocks when the first order is confirmed.`} points={(locations ?? []).map((location) => ({ id: location.user.id, name: location.user.fullName, latitude: location.latitude, longitude: location.longitude, distanceMeters: location.distanceMeters, createdAt: location.createdAt, role: location.role }))} /><div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"><Button variant="outline" disabled={!current || refreshing} onClick={refreshLocations}><RefreshCw className={`mr-1 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "Refreshing..." : "Refresh"}</Button><Button variant="outline" disabled={!current || refreshing} onClick={navigateAll}><MapIcon className="mr-1 h-4 w-4" />Nav All</Button><select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} className="h-9 min-w-48 rounded-lg border border-input px-2 text-sm"><option value="">Select member</option>{memberPoints.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.fullName} - {member.distanceMeters > 1000 ? `${(member.distanceMeters / 1000).toFixed(1)}km` : `${Math.round(member.distanceMeters)}m`}</option>)}</select><Button disabled={!current || !selectedMemberId || refreshing} onClick={navigateOne}><Target className="mr-1 h-4 w-4" />{refreshing ? "Navigating..." : "Nav One"}</Button><span className="ml-auto text-xs text-gray-500">{controlMessage}</span></div><div className="mt-4 rounded-xl border border-gray-100 bg-white shadow-sm"><div className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase text-gray-400">Members Distance from Guide</div>{members.length ? members.map((member) => { const location = locations?.find((item) => item.user.id === member.userId); const age = location ? Math.round((Date.now() - new Date(location.createdAt).getTime()) / 1000) : null; const distance = location?.distanceMeters ?? 0; return <div key={member.id} className="flex items-center justify-between border-b border-gray-50 px-4 py-3 text-sm"><span className="font-semibold text-togt-navy">{member.user?.fullName}</span><span className={distance > 1000 ? "font-bold text-red-600" : distance > 500 ? "text-amber-600" : "text-emerald-600"}>{location ? `${distance > 1000 ? (distance / 1000).toFixed(1) + "km" : Math.round(distance) + "m"}${distance > 1000 ? "" : ""}` : "Device location not available"}{distance > 1000 && <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-red-700 align-middle"><TriangleAlert className="h-3 w-3" /></span>}{age !== null && <span className="ml-2 text-xs text-gray-400">{age}s ago</span>}</span></div>; }) : <EmptyState title="No members" description="Assigned group members will appear here." />}</div></div>;
}


export function GuidePlansTab() {
  const { data: groups, isLoading } = useGroups();
  const [selectedId, setSelectedId] = useState<string>();
  const { data: plan, isLoading: planLoading } = useGroupPlan(selectedId);
  const { updatePlan, confirmPlan } = useGroupMutations();
  if (isLoading) return <LoadingSpinner label="Loading tour plans..." />;
  const selected = groups?.find((group) => group.id === selectedId);
  return <div><PageHeader title="Tour Plans" description="Confirm worker-created orders and update their progress" /><div className="grid grid-cols-1 gap-4 lg:grid-cols-3"><div className="space-y-2">{groups?.map((group) => <button key={group.id} onClick={() => setSelectedId(group.id)} className={`w-full rounded-xl border p-4 text-left ${selectedId === group.id ? "border-togt-orange bg-togt-orange/5" : "border-gray-100 bg-white"}`}><p className="font-semibold text-togt-navy">{group.name}</p><p className="mt-1 text-xs text-gray-500">{group.members.length} members · <StatusBadge value={group.status} /></p></button>)}</div><div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">{!selected ? <EmptyState title="Select a group" description="Choose an assigned group to view its orders." /> : planLoading ? <LoadingSpinner /> : <><h2 className="mb-4 font-bold text-togt-navy">{selected.name}</h2>{plan?.length ? <ol className="space-y-4">{plan.map((step, index) => <li key={step.id} className="flex gap-3"><span className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full ${step.status === "COMPLETED" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-gray-500"}`}>{step.status === "COMPLETED" ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><div className="flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-togt-navy">{step.title}</p><StatusBadge value={step.confirmationStatus ?? "PENDING"} /></div><p className="text-xs text-gray-400">{step.estimatedAt ? new Date(step.estimatedAt).toLocaleString() : "No estimate"}{step.location ? ` · ${step.location}` : ""}</p>{step.description && <p className="mt-1 text-sm text-gray-500">{step.description}</p>}{step.rejectedReason && <p className="mt-1 text-sm text-red-600">Reason: {step.rejectedReason}</p>}<div className="mt-2 flex flex-wrap gap-2">{step.confirmationStatus === "PENDING" && <><Button size="sm" onClick={() => confirmPlan.mutate({ id: selected.id, stepId: step.id, status: "CONFIRMED" })}>Confirm order</Button><Button size="sm" variant="outline" onClick={() => confirmPlan.mutate({ id: selected.id, stepId: step.id, status: "REJECTED", reason: window.prompt("Why are you rejecting this order?") ?? "" })}>Reject</Button></>}{step.status !== "COMPLETED" && <Button size="sm" variant="outline" onClick={() => updatePlan.mutate({ id: selected.id, stepId: step.id, status: step.status === "IN_PROGRESS" ? "COMPLETED" : "IN_PROGRESS", actualAt: step.status === "IN_PROGRESS" ? new Date().toISOString() : undefined })}>{step.status === "IN_PROGRESS" ? "Mark done" : "Start step"}</Button>}</div></div></li>)}</ol> : <EmptyState title="No plan steps yet" description="A worker can add the group tour plan." />}</>}</div></div></div>;
}
