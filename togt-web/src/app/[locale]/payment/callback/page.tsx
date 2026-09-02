"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, TriangleAlert } from "lucide-react";
import { verifyPayment } from "@/lib/api/payment";
import { LoadingSpinner } from "@/components/dashboard/shared/loading-spinner";
import { Button } from "@/components/ui/button";

export default function PaymentCallbackPage() {
  const params = useSearchParams(); const router = useRouter(); const locale = useLocale();
  const [state, setState] = useState<"loading" | "success" | "failed">("loading");
  const [isFlight, setIsFlight] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  useEffect(() => { const reference = params.get("tx_ref") ?? params.get("trx_ref") ?? params.get("transaction_id") ?? params.get("ref_id") ?? params.get("reference"); if (!reference) { setState("failed"); return; } verifyPayment(reference).then((result: { status: string; bookingReference?: string | null }) => { const ok = result.status.toLowerCase() === "success"; setIsFlight(reference.startsWith("TOGT-FL-")); setBookingRef(result.bookingReference ?? ""); setState(ok ? "success" : "failed"); }).catch(() => setState("failed")); }, [params]);
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">{state === "loading" && <LoadingSpinner label="Verifying payment..." />}{state === "success" && <><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><BadgeCheck className="h-8 w-8" /></div><h1 className="mt-4 text-2xl font-bold text-togt-navy">{isFlight ? "Flight Booked" : "Payment Successful"}</h1><p className="mt-2 text-sm text-gray-500">{isFlight ? "Your flight is being confirmed. Your ticket will be issued shortly." : "Your request payment has been received."}</p>{isFlight && bookingRef && <p className="mt-3 text-sm font-semibold text-togt-navy">Booking reference: {bookingRef}</p>}<Button className="mt-6" onClick={() => router.replace(`/${locale}/dashboard/customer?tab=${isFlight ? "tickets" : "requests"}`)}>{isFlight ? "Go to My Tickets" : "Go to My Requests"}</Button></>}{state === "failed" && <><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600"><TriangleAlert className="h-8 w-8" /></div><h1 className="mt-4 text-2xl font-bold text-togt-navy">Payment could not be verified</h1><p className="mt-2 text-sm text-gray-500">Please try again or contact TOGT support.</p><Button className="mt-6" onClick={() => router.replace(`/${locale}/dashboard/customer?tab=requests`)}>Back to Requests</Button></>}</div></main>;
}