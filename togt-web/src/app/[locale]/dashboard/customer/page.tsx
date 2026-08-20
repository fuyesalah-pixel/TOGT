"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ServiceRequest } from "@/lib/api/types";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { LoadingSpinner } from "@/components/dashboard/shared/loading-spinner";
import { ChatTab } from "@/components/dashboard/shared/chat-tab";
import { NotificationsTab } from "@/components/dashboard/shared/notifications-tab";
import { SettingsTab } from "@/components/dashboard/shared/settings-tab";
import { CustomerOverviewTab } from "@/components/dashboard/customer/overview-tab";
import { RequestsTab } from "@/components/dashboard/customer/requests-tab";
import { HistoryTab } from "@/components/dashboard/customer/history-tab";
import { ReviewsTab } from "@/components/dashboard/customer/reviews-tab";
import { TicketsTab } from "@/components/dashboard/shared/tickets-tab";
import { useGroups } from "@/hooks/useGroups";
import { useGroupLocationPublisher } from "@/hooks/useGroupLocationPublisher";
import { ParentTrackingTab } from "@/components/dashboard/customer/parent-tracking-tab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "requests", label: "My Requests" },
  { id: "tickets", label: "My Tickets" },
  { id: "tracking", label: "Parent Tracking" },
  { id: "history", label: "History" },
  { id: "chat", label: "Chat" },
  { id: "reviews", label: "Reviews" },
  { id: "notifications", label: "Notifications" },
  { id: "settings", label: "Settings" },
];

export default function CustomerDashboardPage() {
  const { allowed, isLoading } = useRoleGuard("CUSTOMER");
  const searchParams = useSearchParams();
  const [tab, setTab] = useState("overview");
  const [chatUserId, setChatUserId] = useState<string | undefined>();
  const [reviewTarget, setReviewTarget] = useState<ServiceRequest | null>(null);
  const [refundDraft, setRefundDraft] = useState<string | undefined>();
  const { data: groups } = useGroups();
  const activeGroup = groups?.find((group) => group.status === "IN_PROGRESS");
  useGroupLocationPublisher(activeGroup?.id, !!activeGroup);
  useEffect(() => { const requested = searchParams.get("tab"); if (requested && TABS.some((item) => item.id === requested)) setTab(requested); }, [searchParams]);

  if (isLoading || !allowed) return <LoadingSpinner label="Loading..." />;

  return (
    <div>
      {tab === "overview" && <CustomerOverviewTab onGoToRequests={() => setTab("requests")} submitted={searchParams.get("submitted") === "1"} />}
      {tab === "requests" && (
        <RequestsTab
          onChatWith={(userId) => {
            setChatUserId(userId);
            setTab("chat");
          }}
        />
      )}
      {tab === "history" && (
        <HistoryTab
          onReview={(request) => {
            setReviewTarget(request);
            setTab("reviews");
          }}
        />
      )}
      {tab === "tickets" && <TicketsTab onRefund={(message) => { setRefundDraft(message); setTab("chat"); }} />}
      {tab === "tracking" && <ParentTrackingTab />}
      {tab === "chat" && <ChatTab initialUserId={chatUserId} initialMessage={refundDraft} />}
      {tab === "reviews" && <ReviewsTab preselected={reviewTarget} />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}
