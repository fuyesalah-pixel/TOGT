"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { MockPackage } from "@/lib/data/packages";

export type SmartFormTab = "ticket" | "umrah" | "domestic" | "tourist" | "visa" | "contact";

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

  const openWithPackage = (tab: SmartFormTab, pkg: MockPackage) => {
    setActiveTab(tab);
    setSelectedPackage(pkg);
    document.getElementById("smart-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const openTab = (tab: SmartFormTab) => {
    setActiveTab(tab);
    setSelectedPackage(null);
    document.getElementById("smart-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <SmartFormContext.Provider
      value={{ activeTab, selectedPackage, openWithPackage, openTab }}
    >
      {children}
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
