"use client";

import { PageHeader } from "@/components/dashboard/shared/page-header";
import { BulkNotificationForm } from "./bulk-notification-dialog";

/** Admin "Bulk Messaging" tab — the same composer as the notifications dialog,
 *  promoted to its own tab so it is always one click away. */
export function BulkMessagingTab() {
  return (
    <div>
      <PageHeader
        title="Bulk Messaging"
        description="Send in-app, email, or SMS notifications to everyone or a targeted segment (role, group, service type, or selected users)."
      />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <BulkNotificationForm />
      </div>
    </div>
  );
}
