"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, ShieldCheck, LifeBuoy } from "lucide-react";

type Verification = {
  name: string;
  fatherName?: string | null;
  teamNumber?: string | null;
  idImageUrl?: string | null;
  contact: { phones: string[]; email: string; message: string };
};

/** Emergency hotel contacts shown on every verified pilgrim ID (24/7 reception). */
const emergencyContacts = [
  { name: "Usman Bin Affan Hotel", city: "Madinah", phone: "+966 14 815 7717" },
  { name: "Abraj Al Misk Hotel", city: "Makkah", phone: "+966 55 986 7218" },
];
/** tel: dial href legal format (spaces kept out of the URI). */
const telHref = (phone: string) => `tel:${phone.replace(/\s+/g, "")}`;
export default function VerifyPage() {
  const [record, setRecord] = useState<Verification | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) { setError(true); return; }
    const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = configuredApiUrl && !/localhost|127\.0\.0\.1/.test(configuredApiUrl) ? configuredApiUrl : window.location.origin;
    fetch(`${apiUrl}/api/call-records/verify/${encodeURIComponent(id)}`)
      .then((response) => { if (!response.ok) throw new Error("Not found"); return response.json() as Promise<Verification>; })
      .then(setRecord)
      .catch(() => setError(true));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-5">
      <section className="w-full max-w-md rounded-3xl border border-togt-blue/10 bg-white p-7 text-center shadow-xl">
        <img src="/images/logo/TOGT_Tour_Travel_Final_Logo_For_Print.jpg" alt="TOGT Tour & Travel" className="mx-auto h-14 w-auto object-contain" />
        {record ? <>
          <div className="mx-auto mt-7 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-togt-orange bg-slate-100">
            {record.idImageUrl ? <img src={record.idImageUrl} alt={record.name} className="h-full w-full object-cover" /> : <span className="text-4xl font-bold text-togt-blue">{record.name.charAt(0)}</span>}
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 text-togt-blue"><ShieldCheck className="h-5 w-5" /><span className="text-sm font-bold uppercase tracking-wider">Verified TOGT ID</span></div>
          <h1 className="mt-3 text-2xl font-extrabold text-togt-navy">{record.name}</h1>
          {record.teamNumber && <p className="mt-1 text-xs font-bold uppercase tracking-[.18em] text-togt-blue">Team {record.teamNumber}</p>}
          <p className="mt-6 text-base font-semibold text-togt-navy">{record.contact.message}</p>
          <div className="mt-5 space-y-2 text-sm text-slate-600"><p><Phone className="mr-2 inline h-4 w-4 text-togt-orange" />{record.contact.phones.join(" / ")}</p><p><Mail className="mr-2 inline h-4 w-4 text-togt-orange" />{record.contact.email}</p></div>
          {/* Emergency contacts — always visible inside the card, below the record info */}
          <div className="mt-6 rounded-2xl border-2 border-togt-orange/40 bg-orange-50 p-4 text-left shadow-sm">
            <p className="flex items-center justify-center gap-2 rounded-lg bg-togt-orange px-3 py-2 text-center text-sm font-bold text-white"><LifeBuoy className="h-4 w-4" />Need Help? Contact Our Team</p>
            <div className="mt-3 space-y-2.5">
              {emergencyContacts.map((c) => (
                <a key={c.phone} href={telHref(c.phone)} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2.5 transition hover:bg-white hover:shadow-sm active:bg-white">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-togt-navy">{c.name}</span>
                    <span className="block text-[10px] font-bold uppercase tracking-[.18em] text-togt-blue">{c.city}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-togt-blue px-2.5 py-1.5 text-xs font-bold text-white"><Phone className="h-3.5 w-3.5" />{c.phone}</span>
                </a>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] font-medium text-slate-500">Tap the number to call — 24/7 hotel reception</p>
          </div>
        </> : <div className="py-16 text-slate-500">{error ? "This ID could not be verified." : "Verifying ID..."}</div>}
      </section>
    </main>
  );
}
