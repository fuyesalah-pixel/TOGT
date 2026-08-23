"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { NativeAppShell } from "./native-app-shell";

export function NativeAppGate({ children }: { children: React.ReactNode }) {
  const [native, setNative] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { setNative(Capacitor.isNativePlatform()); setReady(true); document.body.classList.toggle("native-app", Capacitor.isNativePlatform()); return () => document.body.classList.remove("native-app"); }, []);
  if (!ready || !native) return <>{children}</>;
  return <NativeAppShell />;
}
