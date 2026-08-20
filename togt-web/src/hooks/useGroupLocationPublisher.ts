"use client";

import { useEffect, useState } from "react";
import { postGroupLocation } from "@/lib/api/groups";

export function useGroupLocationPublisher(groupId: string | undefined, enabled: boolean) {
  const [error, setError] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  useEffect(() => {
    if (!groupId || !enabled) return;
    if (!navigator.geolocation) { setError("This browser does not support GPS."); return; }
    let stopped = false;
    const send = () => navigator.geolocation.getCurrentPosition(async (position) => {
      if (stopped) return;
      try { await postGroupLocation(groupId, { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }); setLastSentAt(Date.now()); setError(null); } catch (err) { setError(err instanceof Error ? err.message : "Unable to send location"); }
    }, (reason) => setError(reason.message), { enableHighAccuracy: true, maximumAge: 5_000, timeout: 8_000 });
    send();
    const timer = window.setInterval(send, 45_000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [groupId, enabled]);
  return { error, lastSentAt };
}
