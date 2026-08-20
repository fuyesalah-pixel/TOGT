"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { MockPackage } from "@/lib/api/packages";
import { useAuth } from "@/hooks/useAuth";
import { BookingAccessDialog } from "@/components/site/booking-access-dialog";

export type SmartFormTab = "ticket" | "umrah" | "domestic" | "tourist" | "visa" | "foreignTravel" | "contact";

interface SmartFormState {
  activeTab: SmartFormTab;
  selectedPackage: MockPackage | null;
  openWithPackage: (tab: SmartFormTab, pkg: MockPackage) => void;
  openTab: (tab: SmartFormTab) => void;
}

const SmartFormContext = createContext<SmartFormState | null>(null);

export function SmartFormProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<SmartFormTab>("umrah");
  const [selectedPackage, setSelectedPackage] = useState<MockPackage | null>(null);
  const [roleDenied, setRoleDenied] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (window.localStorage.getItem("supportContact") === "1") { setActiveTab("contact"); window.localStorage.removeItem("supportContact"); }
    const pending = window.localStorage.getItem("pendingFormData");
    if (!pending) return;
    try {
      const serviceType = (JSON.parse(pending) as { serviceType?: string }).serviceType;
      const tab = serviceType === "foreignTravel" ? "foreignTravel" : serviceType === "consulting" ? "contact" : serviceType;
      if (["ticket", "umrah", "domestic", "tourist", "visa", "foreignTravel", "contact"].includes(tab ?? "")) {
        setActiveTab(tab as SmartFormTab);
      }
    } catch {
      window.localStorage.removeItem("pendingFormData");
    }
  }, []);

  useEffect(() => {
    const selectContact = () => { setActiveTab("contact"); window.setTimeout(() => document.getElementById("smart-form")?.scrollIntoView({ behavior: "smooth" }), 0); };
    window.addEventListener("selectService", selectContact);
    return () => window.removeEventListener("selectService", selectContact);
  }, []);

  const openWithPackage = (tab: SmartFormTab, pkg: MockPackage) => {
    if (user && user.role !== "CUSTOMER") { setRoleDenied(true); return; }
    setActiveTab(tab);
    setSelectedPackage(pkg);
    document.getElementById("smart-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const openTab = (tab: SmartFormTab) => {
    if (user && user.role !== "CUSTOMER") { setRoleDenied(true); return; }
    setActiveTab(tab);
    setSelectedPackage(null);
    document.getElementById("smart-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <SmartFormContext.Provider
      value={{ activeTab, selectedPackage, openWithPackage, openTab }}
      >
        {children}
        {roleDenied && user && user.role !== "CUSTOMER" && <BookingAccessDialog role={user.role} onClose={() => setRoleDenied(false)} />}
    </SmartFormContext.Provider>
  );
}

export function useSmartForm() {
  const ctx = useContext(SmartFormContext);
  if (!ctx) {
    throw new Error("useSmartForm must be used within a SmartFormProvider");
  }
  return ctx;
}
