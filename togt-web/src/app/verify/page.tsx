"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, ShieldCheck } from "lucide-react";

type Verification = {
  name: string;
  fatherName?: string | null;
  teamNumber?: string | null;
  idImageUrl?: string | null;
  contact: { phones: string[]; email: string; message: string };
};

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
        </> : <div className="py-16 text-slate-500">{error ? "This ID could not be verified." : "Verifying ID..."}</div>}
      </section>
    </main>
  );
}
