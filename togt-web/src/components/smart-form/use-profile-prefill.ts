"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

/** Prefills shared customer identity fields without preventing later edits. */
export function useProfilePrefill(form: { setValue: unknown }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const values = {
      fullName: user.fullName ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
      billingAddress: user.address ?? "",
      permanentAddress: user.address ?? "",
      emergencyContactAddress: user.address ?? "",
      birthday: user.birthday?.slice(0, 10) ?? "",
      dob: user.birthday?.slice(0, 10) ?? "",
      passportIssuedDate: user.passportIssueDate?.slice(0, 10) ?? "",
      nationality: user.nationality ?? "",
      passportNumber: user.passportNumber ?? "",
      passportExpiry: user.passportExpiry?.slice(0, 10) ?? "",
    };
    let pendingValues: Record<string, unknown> | undefined;
    try {
      const pending = window.localStorage.getItem("pendingFormData");
      pendingValues = pending ? (JSON.parse(pending) as { payload?: Record<string, unknown> }).payload : undefined;
      if (pendingValues) {
        Object.entries(pendingValues).forEach(([name, value]) => {
          if (typeof value === "string" && value && name in values) values[name as keyof typeof values] = value;
        });
      }
    } catch {
      // Ignore malformed pending form data and keep profile values.
    }
    const setValue = form.setValue as (name: string, value: string) => void;
    Object.entries(values).forEach(([name, value]) => {
      if (value) setValue(name, value);
    });
    if (pendingValues) {
      Object.entries(pendingValues).forEach(([name, value]) => {
        if (value !== undefined && value !== null) setValue(name, value as string);
      });
    }
  }, [user, form]);
}
