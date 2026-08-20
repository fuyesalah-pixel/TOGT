"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/dashboard/shared/loading-spinner";
import { createServiceRequest } from "@/lib/api/service-requests";
import { initializePayment } from "@/lib/api/payment";

export default function AuthCallbackPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      const pendingRaw = window.localStorage.getItem("pendingFormData");
      if (pendingRaw) {
        let pending: { serviceType: string; payload: Record<string, unknown>; paymentChoice?: "PAY_NOW" | "PAY_LATER" };
        try { pending = JSON.parse(pendingRaw); } catch { window.localStorage.removeItem("pendingFormData"); router.replace(`/${locale}/dashboard/${user.role.toLowerCase()}`); return; }
        if (user.role !== "CUSTOMER") { window.localStorage.removeItem("pendingFormData"); router.replace(`/${locale}/dashboard/${user.role.toLowerCase()}`); return; }
        (async () => {
          try {
            const serviceType = pending.serviceType === "foreignTravel" ? "FOREIGN_TRAVEL" : pending.serviceType.toUpperCase();
            const request = await createServiceRequest({ serviceType: serviceType as "TICKET" | "UMRAH" | "DOMESTIC" | "TOURIST" | "VISA" | "CONSULTING" | "FOREIGN_TRAVEL", formData: pending.payload, packageId: typeof pending.payload.packageId === "string" ? pending.payload.packageId : undefined });
            window.localStorage.removeItem("pendingFormData");
            if (pending.paymentChoice === "PAY_NOW" && typeof pending.payload.amount === "number" && pending.payload.amount > 0) {
              const payment = await initializePayment(request.id, pending.payload.amount, "ETB");
              window.location.href = payment.checkoutUrl;
            } else router.replace(`/${locale}/dashboard/customer?tab=requests&submitted=1`);
          } catch { router.replace(`/${locale}/dashboard/customer?tab=requests&payment=error`); }
        })();
        return;
      }
      if (window.localStorage.getItem("pendingFormData")) {
         window.location.href = `/${locale}#smart-form`;
       } else if (window.localStorage.getItem("pendingBooking") || window.localStorage.getItem("pendingFlightBooking")) {
         window.location.href = `/${locale}#flight-booking`;
      } else {
        router.replace(`/${locale}/dashboard/${user.role.toLowerCase()}`);
      }
    } else {
      router.replace(`/${locale}/login?error=auth`);
    }
  }, [user, isLoading, locale, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <LoadingSpinner label="Signing you in..." />
    </div>
  );
}
