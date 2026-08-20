"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Map as MapIcon } from "lucide-react";
import { getGroupLocation } from "@/lib/api/groups";
import { Button } from "@/components/ui/button";

export interface GuideMapPoint {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  distanceMeters?: number;
  role?: "MEMBER" | "GUIDE";
  createdAt?: string;
}

const GuideMapInner = dynamic(() => import("./guide-map-inner").then((module) => module.GuideMapInner), {
  ssr: false,
  loading: () => <div className="flex h-[500px] w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">Loading map...</div>,
});

export function GuideMap({ points = [], locked = false, lockMessage, routeMode = "all", focusMemberId, flyTo, groupId }: { points?: GuideMapPoint[]; locked?: boolean; lockMessage?: string; routeMode?: "all" | "one" | "none"; focusMemberId?: string; flyTo?: { longitude: number; latitude: number; nonce: number }; groupId?: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const guide = points.find((point) => point.role === "GUIDE");
  const locate = async () => { setLoading(true); const location = groupId ? await getGroupLocation(groupId) : guide ? { latitude: guide.latitude, longitude: guide.longitude, locationName: "Guide current location" } : null; setLoading(false); if (!location) { setMessage("Location unavailable"); return; } setMessage(`At ${location.locationName}`); window.dispatchEvent(new CustomEvent("togt:map-fly-to", { detail: location })); };
  return <div><GuideMapInner points={points} locked={locked} lockMessage={lockMessage} routeMode={routeMode} focusMemberId={focusMemberId} flyTo={flyTo} /><div className="mt-2 flex items-center gap-2"><Button variant="outline" disabled={loading || locked || (!groupId && !guide)} onClick={locate}><MapIcon className="mr-1 h-4 w-4" />{loading ? "Locating..." : "Go to Group Location"}</Button>{message && <span className="text-xs text-gray-500">{message}</span>}</div></div>;
}
