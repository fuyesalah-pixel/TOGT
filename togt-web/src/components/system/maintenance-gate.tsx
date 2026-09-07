"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";
import { API_URL } from "@/lib/api/client";

type MaintenanceState = { enabled: boolean; message: string };

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<MaintenanceState>({ enabled: false, message: "TOGT is temporarily unavailable for maintenance." });

  useEffect(() => {
    let active = true;
    const check = () => fetch(`${API_URL}/api/system/maintenance/public`, { cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<MaintenanceState> : null).then((data) => { if (active && data) setState(data); }).catch(() => undefined);
    void check();
    const timer = window.setInterval(check, 30000);
    const socket = io(API_URL, { path: "/api/socket.io", transports: ["websocket"] });
    socket.on("maintenance_mode_changed", (data: MaintenanceState) => { if (active) setState(data); });
    return () => { active = false; window.clearInterval(timer); socket.disconnect(); };
  }, []);

  if (state.enabled && user?.role !== "TECH") {
    return <main className="flex min-h-screen items-center justify-center bg-[#12394F] px-6 text-center text-white"><div className="w-full max-w-lg rounded-3xl bg-white p-8 text-[#12394F] shadow-2xl sm:p-12"><Image src="/images/logo/TOGT_Tour_Travel_Final_Logo_For_Print.jpg" alt="TOGT Tour & Travel" width={220} height={70} className="mx-auto h-auto w-52 object-contain" /><div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF9300]/15 text-3xl">&#9881;</div><h1 className="mt-6 text-3xl font-black">We&apos;re under maintenance</h1><p className="mt-3 text-slate-600">{state.message}</p><p className="mt-2 font-semibold text-[#1F67B1]">We&apos;ll be back soon.</p><div className="mt-8 border-t border-slate-100 pt-5 text-sm text-slate-500"><p>For urgent assistance</p><p className="mt-1 font-bold text-[#12394F]">+251 99 797 9741</p><p>info@togttrading.com</p></div></div></main>;
  }
  return <>{children}</>;
}
