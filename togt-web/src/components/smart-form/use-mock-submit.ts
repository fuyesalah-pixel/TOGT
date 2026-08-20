"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useCreateServiceRequest } from "@/hooks/useServiceRequests";
import { listPackages } from "@/lib/api/packages";
import { initializePayment } from "@/lib/api/payment";

/**
 * Shared submit handler retained for the existing form tabs. It now creates
 * a real ServiceRequest and uses the authenticated user from the API session.
 */
export function useMockSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user } = useAuth();
  const locale = useLocale();
  const createRequest = useCreateServiceRequest();

  async function submit(serviceType: string, payload: Record<string, unknown>) {
    const normalizedType = serviceType === "foreignTravel" ? "FOREIGN_TRAVEL" : serviceType.toUpperCase();
    const packages = await listPackages();
    const selectedPackage = typeof payload.packageId === "string" ? packages.find((item) => item.id === payload.packageId) : undefined;
    const amount = typeof payload.amount === "number" ? payload.amount : selectedPackage?.price ?? 0;
    if (!user) {
      const saveAndLogin = async (payNow: boolean) => { localStorage.setItem("pendingFormData", JSON.stringify({ serviceType, payload: { ...payload, amount, packageName: selectedPackage?.title }, paymentChoice: payNow ? "PAY_NOW" : "PAY_LATER" })); window.location.href = `/${locale}/login?redirect=smart-form`; };
      window.dispatchEvent(new CustomEvent("togt:payment-options", { detail: { packageName: selectedPackage?.title ?? normalizedType.replace(/_/g, " "), amount, currency: selectedPackage?.currency ?? "ETB", onPayNow: () => saveAndLogin(true), onPayLater: () => saveAndLogin(false) } }));
      return;
    }
    const complete = async (payNow: boolean) => {
      setIsSubmitting(true); setIsSuccess(false); window.dispatchEvent(new Event("togt:submit-start"));
      try {
        const request = await createRequest.mutateAsync({ serviceType: normalizedType as "TICKET" | "UMRAH" | "DOMESTIC" | "TOURIST" | "VISA" | "CONSULTING" | "FOREIGN_TRAVEL", formData: { ...payload, amount, packageName: selectedPackage?.title }, packageId: typeof payload.packageId === "string" ? payload.packageId : undefined });
        localStorage.removeItem("pendingFormData");
        if (payNow && amount > 0) { const payment = await initializePayment(request.id, amount, selectedPackage?.currency ?? "ETB"); window.location.href = payment.checkoutUrl; return; }
        await new Promise((resolve) => window.setTimeout(resolve, 500)); window.location.href = `/${locale}/dashboard/customer?submitted=1`;
      } catch (error) { window.dispatchEvent(new Event("togt:submit-end")); if (typeof window !== "undefined") window.alert(error instanceof Error ? error.message : "Payment initialization failed"); throw error; } finally { setIsSubmitting(false); }
    };
    window.dispatchEvent(new CustomEvent("togt:payment-options", { detail: { packageName: selectedPackage?.title ?? normalizedType.replace(/_/g, " "), amount, currency: selectedPackage?.currency ?? "ETB", onPayNow: () => complete(true), onPayLater: () => complete(false) } }));
  }

  function reset() {
    setIsSuccess(false);
  }

  return { submit, isSubmitting: isSubmitting || createRequest.isPending, isSuccess, reset };
}
