"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { LoadingSpinner } from "@/components/dashboard/shared/loading-spinner";
import { ChatTab } from "@/components/dashboard/shared/chat-tab";
import { NotificationsTab } from "@/components/dashboard/shared/notifications-tab";
import { SettingsTab } from "@/components/dashboard/shared/settings-tab";
import { OverviewTab } from "@/components/dashboard/worker/overview-tab";
import { UsersTab } from "@/components/dashboard/worker/users-tab";
import { PackagesTab } from "@/components/dashboard/worker/packages-tab";
import { CreateTab } from "@/components/dashboard/worker/create-tab";
import { ProgressTab } from "@/components/dashboard/worker/progress-tab";
import { WorkerGroupsTab } from "@/components/dashboard/worker/groups-tab";
import { TicketsTab } from "@/components/dashboard/shared/tickets-tab";
import { CallTrackerTab } from "@/components/dashboard/shared/call-tracker-tab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "tickets", label: "Tickets" },
  { id: "calls", label: "Call Tracker" },
  { id: "packages", label: "Packages" },
  { id: "groups", label: "Groups" },
  { id: "create", label: "Create" },
  { id: "progress", label: "Progress" },
  { id: "chat", label: "Chat" },
  { id: "notifications", label: "Notifications" },
  { id: "settings", label: "Settings" },
];

export default function WorkerDashboardPage() {
  const { allowed, isLoading } = useRoleGuard("WORKER");
  const [tab, setTab] = useState("overview");
  const searchParams = useSearchParams();
  useEffect(() => { const requested = searchParams.get("tab"); if (requested && TABS.some((item) => item.id === requested)) setTab(requested); }, [searchParams]);

  if (isLoading || !allowed) return <LoadingSpinner label="Loading..." />;

  return (
    <div>
      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "tickets" && <TicketsTab staff />}
      {tab === "calls" && <CallTrackerTab staff />}
      {tab === "packages" && <PackagesTab />}
      {tab === "groups" && <WorkerGroupsTab />}
      {tab === "create" && <CreateTab />}
      {tab === "progress" && <ProgressTab />}
      {tab === "chat" && <ChatTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}
