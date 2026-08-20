"use client";

import { useMemo, useState } from "react";
import { CheckCheck, CheckCircle, Trash2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotificationActions, useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "./page-header";
import { LoadingSpinner } from "./loading-spinner";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";

const icons: Record<string, string> = { SYSTEM: "🔔", STATUS_UPDATE: "📊", NEW_PACKAGE: "📦", CHAT_MESSAGE: "💬", ALERT: "⚠️" };

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return "Yesterday";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function NotificationsTab() {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const actions = useNotificationActions();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [type, setType] = useState("all");
  const visible = useMemo(() => (notifications ?? []).filter((notification) => (filter === "all" || (filter === "unread" ? !notification.isRead : notification.isRead)) && (type === "all" || notification.type === type)), [notifications, filter, type]);
  const hasUnread = notifications?.some((notification) => !notification.isRead) ?? false;

  if (isLoading) return <LoadingSpinner label="Loading notifications..." />;
  return <div>
    <PageHeader title="Notifications" description="Updates about your requests, messages and system alerts" actions={<div className="flex flex-wrap gap-2">{hasUnread && <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}><CheckCheck className="h-4 w-4" />Mark all read</Button>}<Button variant="outline" onClick={() => actions.clearNotifications.mutate()}><Trash2 className="h-4 w-4" />Clear all</Button></div>} />
    <div className="mb-4 flex gap-2"><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="h-8 rounded-lg border border-input px-2.5 text-sm"><option value="all">All</option><option value="unread">Unread</option><option value="read">Read</option></select><select value={type} onChange={(event) => setType(event.target.value)} className="h-8 rounded-lg border border-input px-2.5 text-sm"><option value="all">All types</option><option value="SYSTEM">System</option><option value="STATUS_UPDATE">Status updates</option><option value="NEW_PACKAGE">Packages</option><option value="CHAT_MESSAGE">Chat</option><option value="ALERT">Alerts</option></select></div>
    {visible.length === 0 ? <EmptyState title="No notifications" description="You're all caught up." /> : <div className="space-y-2">{visible.map((notification) => <div key={notification.id} className={cn("rounded-xl border p-4", notification.isRead ? "border-gray-100 bg-white" : "border-togt-blue/20 bg-togt-blue/5")}>
      <div className="flex items-start gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-lg">{icons[notification.type] ?? "🔔"}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="text-sm font-semibold text-togt-navy">{notification.title}</p><span className="text-[11px] text-gray-400">{relativeTime(notification.sentAt)}</span></div><p className="mt-1 text-sm text-gray-600">{notification.message}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-500">{notification.type.replace(/_/g, " ")}</span>{!notification.isRead && <span className="rounded-full bg-togt-orange/15 px-2 py-0.5 text-[10px] font-bold text-togt-orange">NEW</span>}</div>
      {notification.type === "ALERT" && typeof notification.data?.fingerprint === "string" && !notification.isRead && <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => actions.confirmDevice.mutate(notification.id)}><CheckCircle className="h-3.5 w-3.5" />Yes, it&apos;s me</Button><Button size="sm" variant="destructive" onClick={async () => { await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/auth/logout-all`, { method: "POST", credentials: "include" }); window.location.href = `/${user ? "en" : "en"}/login?reason=security`; }}><XCircle className="h-3.5 w-3.5" />This is not me</Button></div>}
      </div><button onClick={() => actions.deleteNotification.mutate(notification.id)} aria-label="Delete notification" className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div>
      {!notification.isRead && <button onClick={() => markRead.mutate(notification.id)} className="mt-2 text-xs font-semibold text-togt-blue hover:underline">Mark as read</button>}
    </div>)}</div>}
  </div>;
}
