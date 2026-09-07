"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { LoadingSpinner } from "@/components/dashboard/shared/loading-spinner";
import { SettingsTab } from "@/components/dashboard/shared/settings-tab";
import { SystemDashboard } from "@/components/dashboard/tech/system-dashboard";

  const TABS = [
   { id: "health", label: "System Control" },
  { id: "settings", label: "Settings" },
];

export default function TechDashboardPage() {
  const { allowed, isLoading } = useRoleGuard("TECH");
  const [tab, setTab] = useState("health");
  const searchParams = useSearchParams();
  useEffect(() => { const requested = searchParams.get("tab"); if (requested && TABS.some((item) => item.id === requested)) setTab(requested); }, [searchParams]);

  if (isLoading || !allowed) return <LoadingSpinner label="Loading..." />;

  return (
    <div>
      {tab === "health" && <SystemDashboard />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}
