"use client";

import { AlertTriangle, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/api/types";

const messages: Record<Exclude<Role, "CUSTOMER">, string> = {
  WORKER: "Your worker account is for managing services. Please use your dashboard.",
  GUIDE: "Your guide account is for leading groups. Please use your dashboard.",
  ADMIN: "Your admin account has full management access. Please use your dashboard.",
  TECH: "Your tech account is for system maintenance. Please use your dashboard.",
};

export function BookingAccessDialog({ role, onClose }: { role: Exclude<Role, "CUSTOMER">; onClose: () => void }) {
  const router = useRouter();
  const locale = useLocale();
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl"><button aria-label="Close" onClick={onClose} className="float-right text-gray-400"><X className="h-5 w-5" /></button><AlertTriangle className="mx-auto h-10 w-10 text-togt-orange" /><h2 className="mt-4 text-xl font-bold text-togt-navy">Sorry, You Don&apos;t Have Access</h2><p className="mt-3 text-sm text-gray-500">Your account is registered as <b>{role}</b>. Staff accounts cannot book packages or submit forms from the public website.</p><p className="mt-2 text-sm text-gray-500">{messages[role]}</p><div className="mt-6 flex justify-center gap-3"><Button variant="outline" onClick={onClose}>Close</Button><Button className="bg-togt-blue text-white" onClick={() => router.push(`/${locale}/dashboard/${role.toLowerCase()}`)}>Go to Dashboard</Button></div></div></div>;
}
