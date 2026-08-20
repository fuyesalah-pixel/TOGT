"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Megaphone } from "lucide-react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { LoadingSpinner } from "@/components/dashboard/shared/loading-spinner";
import { NotificationsTab } from "@/components/dashboard/shared/notifications-tab";
import { SettingsTab } from "@/components/dashboard/shared/settings-tab";
import { Button } from "@/components/ui/button";
import { OverviewTab } from "@/components/dashboard/worker/overview-tab";
import { PackagesTab } from "@/components/dashboard/worker/packages-tab";
import { UsersAdminTab } from "@/components/dashboard/admin/users-admin-tab";
import { ReviewsAdminTab } from "@/components/dashboard/admin/reviews-admin-tab";
import { BulkNotificationDialog } from "@/components/dashboard/admin/bulk-notification-dialog";
import { AdminGroupsTab } from "@/components/dashboard/admin/groups-admin-tab";
import { TicketsTab } from "@/components/dashboard/shared/tickets-tab";
import { AdminTrackingTab } from "@/components/dashboard/admin/tracking-tab";
import { ReportsTab } from "@/components/dashboard/admin/reports-tab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "tickets", label: "Tickets" },
  { id: "tracking", label: "Tracking" },
  { id: "reports", label: "Reports" },
  { id: "packages", label: "Packages" },
  { id: "groups", label: "Groups" },
  { id: "reviews", label: "Reviews" },
  { id: "notifications", label: "Notifications" },
  { id: "settings", label: "Settings" },
];

export default function AdminDashboardPage() {
  const { allowed, isLoading } = useRoleGuard("ADMIN");
  const [tab, setTab] = useState("overview");
  const [bulkOpen, setBulkOpen] = useState(false);
  const searchParams = useSearchParams();
  useEffect(() => { const requested = searchParams.get("tab"); if (requested && TABS.some((item) => item.id === requested)) setTab(requested); }, [searchParams]);

  if (isLoading || !allowed) return <LoadingSpinner label="Loading..." />;

  return (
    <div>
      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersAdminTab />}
      {tab === "tickets" && <TicketsTab staff admin />}
      {tab === "tracking" && <AdminTrackingTab />}
      {tab === "reports" && <ReportsTab />}
      {tab === "packages" && <PackagesTab />}
      {tab === "groups" && <AdminGroupsTab />}
      {tab === "reviews" && <ReviewsAdminTab />}
      {tab === "notifications" && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => setBulkOpen(true)}
              className="bg-togt-orange text-white hover:bg-togt-orange/90"
            >
              <Megaphone className="h-4 w-4" />
              Send bulk notification
            </Button>
          </div>
          <NotificationsTab />
        </div>
      )}
      {tab === "settings" && <SettingsTab />}
      <BulkNotificationDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  );
}
