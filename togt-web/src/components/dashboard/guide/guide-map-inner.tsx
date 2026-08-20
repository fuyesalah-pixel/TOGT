"use client";

import { useEffect, useRef, useState } from "react";
import Map, { FullscreenControl, Layer, Marker, NavigationControl, Popup, Source, type MapRef } from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { GuideMapPoint } from "./guide-map";

export function GuideMapInner({ points = [], locked = false, lockMessage = "This group is not currently active.", routeMode = "all", focusMemberId, flyTo }: { points?: GuideMapPoint[]; locked?: boolean; lockMessage?: string; routeMode?: "all" | "one" | "none"; focusMemberId?: string; flyTo?: { longitude: number; latitude: number; nonce: number } }) {
  const [selected, setSelected] = useState<GuideMapPoint | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const guide = points.find((point) => point.role === "GUIDE");
  const members = points.filter((point) => point.role !== "GUIDE" && (routeMode !== "one" || point.id === focusMemberId));
  useEffect(() => {
    if (!mapRef.current || locked || !guide || !members.length) return;
    const all = [guide, ...members];
    const bounds = all.reduce((result, point) => result.extend([point.longitude, point.latitude]), new LngLatBounds([guide.longitude, guide.latitude], [guide.longitude, guide.latitude]));
    mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 700 });
  }, [locked, guide?.longitude, guide?.latitude, members.map((point) => `${point.id}:${point.longitude}:${point.latitude}`).join("|"), routeMode, focusMemberId]);
  useEffect(() => { if (!mapRef.current || !flyTo) return; mapRef.current.flyTo({ center: [flyTo.longitude, flyTo.latitude], zoom: 14, duration: 1000 }); }, [flyTo?.nonce, flyTo?.longitude, flyTo?.latitude]);
  useEffect(() => { const handler = (event: Event) => { const location = (event as CustomEvent<{ longitude: number; latitude: number }>).detail; mapRef.current?.flyTo({ center: [location.longitude, location.latitude], zoom: 14, duration: 1000 }); }; window.addEventListener("togt:map-fly-to", handler); return () => window.removeEventListener("togt:map-fly-to", handler); }, []);

  if (!token) {
    return <div className="flex h-[500px] w-full items-center justify-center rounded-xl bg-slate-100 text-sm text-gray-500">Mapbox token is not configured.</div>;
  }

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl border border-gray-200">
      {mapError && <div className="absolute inset-x-3 top-3 z-20 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 shadow">Mapbox error: {mapError}</div>}
      <Map
        mapboxAccessToken={token}
        initialViewState={{ longitude: 38.7468, latitude: 9.0119, zoom: 10 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "500px", minHeight: "300px" }}
        ref={mapRef}
        onLoad={(event) => { setStyleLoaded(true); event.target.resize(); }}
        onStyleData={() => setStyleLoaded(true)}
        onError={(event) => setMapError(event.error?.message ?? "Unable to load Mapbox tiles")}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        {!locked && routeMode !== "none" && guide && members.map((member) => <Source key={`${guide.id}-${member.id}`} id={`route-${guide.id}-${member.id}`} type="geojson" data={{ type: "Feature", properties: { distance: member.distanceMeters ?? 0 }, geometry: { type: "LineString", coordinates: [[guide.longitude, guide.latitude], [member.longitude, member.latitude]] } }}><Layer id={`route-layer-${guide.id}-${member.id}`} type="line" layout={{ "line-cap": "round", "line-join": "round", ...(member.distanceMeters && member.distanceMeters > 1000 ? { "line-dasharray": [1.5, 1.5] } : {}) }} paint={{ "line-color": (member.distanceMeters ?? 0) > 1000 ? "#ef4444" : (member.distanceMeters ?? 0) > 500 ? "#eab308" : "#22c55e", "line-width": (member.distanceMeters ?? 0) > 1000 ? 5 : 3, "line-opacity": routeMode === "one" && member.id !== focusMemberId ? 0.25 : 0.85 }} /></Source>)}
        {!locked && points.map((point) => (
          <Marker
            key={point.id}
            longitude={point.longitude}
            latitude={point.latitude}
            anchor="bottom"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              setSelected(point);
            }}
          >
            <div className={`flex flex-col items-center ${routeMode === "one" && point.role !== "GUIDE" && point.id !== focusMemberId ? "opacity-50" : ""}`}><span className="whitespace-nowrap rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-togt-navy shadow">{point.role === "GUIDE" ? `Guide: ${point.name}` : `Member: ${point.name}`}</span><span className={`flex ${point.role === "GUIDE" ? "h-9 w-9" : "h-6 w-6"} items-center justify-center rounded-full border-2 border-white text-xs shadow ${point.role === "GUIDE" ? "bg-togt-blue" : point.distanceMeters && point.distanceMeters > 1000 ? "bg-red-500" : point.distanceMeters && point.distanceMeters > 500 ? "bg-yellow-400" : "bg-emerald-500"}`}>{point.role === "GUIDE" ? "G" : "M"}</span></div>
          </Marker>
        ))}
        {selected && (
          <Popup longitude={selected.longitude} latitude={selected.latitude} anchor="top" onClose={() => setSelected(null)}>
            <strong>{selected.name}</strong>
            <p>{selected.role === "GUIDE" ? "Guide location" : `${Math.round(selected.distanceMeters ?? 0)}m from guide`}</p>
          </Popup>
        )}
        {!locked && routeMode !== "none" && guide && members.map((member) => <Marker key={`distance-${member.id}`} longitude={(guide.longitude + member.longitude) / 2} latitude={(guide.latitude + member.latitude) / 2} anchor="center"><span className="rounded bg-white/90 px-1 text-[10px] font-bold text-togt-navy shadow">{member.distanceMeters && member.distanceMeters > 1000 ? `${(member.distanceMeters / 1000).toFixed(1)}km` : `${Math.round(member.distanceMeters ?? 0)}m`}</span></Marker>)}
      </Map>
      {!styleLoaded && !mapError && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="rounded-lg bg-white/90 px-3 py-2 text-xs text-gray-500 shadow">Loading map tiles...</span></div>}
      {locked && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/45"><span className="rounded-xl bg-white px-5 py-4 text-center text-sm font-semibold text-togt-navy shadow-xl">Locked map<br /><span className="text-xs font-normal text-gray-500">{lockMessage}</span></span></div>}
      {!locked && points.length === 0 && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="rounded-lg bg-white/90 px-3 py-2 text-xs text-gray-500 shadow">Device location not available</span></div>}
    </div>
  );
}
