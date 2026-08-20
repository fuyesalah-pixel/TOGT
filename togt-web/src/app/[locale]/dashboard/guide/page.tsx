"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { LoadingSpinner } from "@/components/dashboard/shared/loading-spinner";
import { ChatTab } from "@/components/dashboard/shared/chat-tab";
import { NotificationsTab } from "@/components/dashboard/shared/notifications-tab";
import { SettingsTab } from "@/components/dashboard/shared/settings-tab";
import { GroupsTab } from "@/components/dashboard/guide/groups-tab";
import { GuideOverviewTab, GuideTrackingTab, GuidePlansTab } from "@/components/dashboard/guide/guide-tabs";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "groups", label: "My Groups" },
  { id: "tracking", label: "GPS Tracking" },
  { id: "plans", label: "Tour Plans" },
  { id: "chat", label: "Chat" },
  { id: "notifications", label: "Notifications" },
  { id: "settings", label: "Settings" },
];

export default function GuideDashboardPage() {
  const { allowed, isLoading } = useRoleGuard("GUIDE");
  const [tab, setTab] = useState("groups");
  const searchParams = useSearchParams();
  useEffect(() => { const requested = searchParams.get("tab"); if (requested && TABS.some((item) => item.id === requested)) setTab(requested); }, [searchParams]);

  if (isLoading || !allowed) return <LoadingSpinner label="Loading..." />;

  return (
    <div>
      {tab === "groups" && <GroupsTab />}
      {tab === "overview" && <GuideOverviewTab />}
      {tab === "tracking" && <GuideTrackingTab />}
      {tab === "plans" && <GuidePlansTab />}
      {tab === "chat" && <ChatTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}
