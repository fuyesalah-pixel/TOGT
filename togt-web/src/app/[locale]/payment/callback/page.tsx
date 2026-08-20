"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPayment } from "@/lib/api/payment";
import { LoadingSpinner } from "@/components/dashboard/shared/loading-spinner";
import { Button } from "@/components/ui/button";

export default function PaymentCallbackPage() {
  const params = useSearchParams(); const router = useRouter(); const locale = useLocale();
  const [state, setState] = useState<"loading" | "success" | "failed">("loading");
  useEffect(() => { const reference = params.get("tx_ref") ?? params.get("trx_ref") ?? params.get("transaction_id") ?? params.get("ref_id") ?? params.get("reference"); if (!reference) { setState("failed"); return; } verifyPayment(reference).then((result) => setState(result.status.toLowerCase() === "success" ? "success" : "failed")).catch(() => setState("failed")); }, [params]);
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">{state === "loading" && <LoadingSpinner label="Verifying payment..." />}{state === "success" && <><div className="text-5xl">✅</div><h1 className="mt-4 text-2xl font-bold text-togt-navy">Payment Successful</h1><p className="mt-2 text-sm text-gray-500">Your request payment has been received.</p><Button className="mt-6" onClick={() => router.replace(`/${locale}/dashboard/customer?tab=requests`)}>Go to My Requests</Button></>}{state === "failed" && <><div className="text-5xl">⚠️</div><h1 className="mt-4 text-2xl font-bold text-togt-navy">Payment could not be verified</h1><p className="mt-2 text-sm text-gray-500">Please try again or contact TOGT support.</p><Button className="mt-6" onClick={() => router.replace(`/${locale}/dashboard/customer?tab=requests`)}>Back to Requests</Button></>}</div></main>;
}
