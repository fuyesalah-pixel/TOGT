"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, MapPin, Phone, RefreshCw } from "lucide-react";
import { searchTrackingMember } from "@/lib/api/tracking";
import { GuideMap } from "../guide/guide-map";
import { PageHeader } from "../shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ParentTrackingTab() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const tracking = useQuery({ queryKey: ["parent-tracking", query], queryFn: () => searchTrackingMember(query), enabled: !!query, refetchInterval: 45_000, retry: false });
  const result = tracking.data;
  const points = result?.memberLocation ? [{ id: "guide", name: result.guideLocation?.name ?? "Guide", latitude: result.guideLocation?.latitude ?? result.memberLocation.latitude, longitude: result.guideLocation?.longitude ?? result.memberLocation.longitude, role: "GUIDE" as const }, { id: result.memberId, name: result.memberName, latitude: result.memberLocation.latitude, longitude: result.memberLocation.longitude, distanceMeters: result.distance, role: "MEMBER" as const }] : [];
  return <div><PageHeader title="Parent Tracking" description="Track your loved one's location during their journey." /><form className="mb-4 flex max-w-xl gap-2" onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); }}><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, or member ID" /><Button type="submit">Search</Button></form>{tracking.error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Member not found in any active group.</p>}{result && <><GuideMap points={points} routeMode="one" focusMemberId={result.memberId} /><div className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-bold text-togt-navy">{result.memberName}</h2><p className="text-sm text-gray-500">Group: {result.groupName}</p></div><Button variant="outline" size="sm" onClick={() => tracking.refetch()} disabled={tracking.isFetching}><RefreshCw className={`mr-1 h-4 w-4 ${tracking.isFetching ? "animate-spin" : ""}`} />Refresh</Button></div><p className={`mt-4 font-semibold ${result.status === "DANGER" ? "text-red-600" : result.status === "WARNING" ? "text-amber-600" : result.status === "OFFLINE" ? "text-gray-500" : "text-emerald-600"}`}>{result.status === "DANGER" && <AlertTriangle className="mr-1 inline h-4 w-4" />}{result.status} - {result.distance > 1000 ? `${(result.distance / 1000).toFixed(1)}km` : `${Math.round(result.distance)}m`} from guide</p><p className="mt-2 text-xs text-gray-500"><MapPin className="mr-1 inline h-3 w-3" />Last updated: {result.lastUpdated ? new Date(result.lastUpdated).toLocaleString() : "Unavailable"}</p>{result.status === "DANGER" && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Your family member may be separated from the guide. The guide has been notified.</div>}<div className="mt-4 flex gap-2">{result.phone && <a className="inline-flex h-7 items-center rounded-lg border px-2.5 text-sm" href={`tel:${result.phone}`}><Phone className="mr-1 h-4 w-4" />Call Member</a>}</div></div></>}{!result && !tracking.isFetching && <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-500">Search for a linked family member in an active group.</div>}</div>;
}
