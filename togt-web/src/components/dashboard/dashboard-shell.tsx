"use client";

import type { ReactNode } from "react";
import { Bell, ExternalLink, LogOut, Menu, Plane, LayoutDashboard, Users, Package, Plus, LineChart, MessageCircle, Settings, Layers, ShieldCheck, Activity, Ticket, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, useUnreadNotificationCount } from "@/hooks/useNotifications";
import { useChatUnreadCount } from "@/hooks/useChat";
import { useChatSocket } from "@/hooks/useChat";
import { StatusBadge } from "./shared/status-badge";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { data: notifications } = useNotifications(!!user);
  const { data: unreadNotifications } = useUnreadNotificationCount();
  const { data: chatUnread } = useChatUnreadCount();
  useChatSocket();
  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  if (!user) return null;

  const roleTabs: Record<string, { id: string; label: string; icon: typeof Menu }[]> = {
    CUSTOMER: [
      { id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "requests", label: "My Requests", icon: LineChart }, { id: "tickets", label: "My Tickets", icon: Ticket }, { id: "tracking", label: "Parent Tracking", icon: Activity },
      { id: "history", label: "History", icon: Layers }, { id: "chat", label: "Chat", icon: MessageCircle },
      { id: "reviews", label: "Reviews", icon: ShieldCheck }, { id: "notifications", label: "Notifications", icon: Bell }, { id: "settings", label: "Settings", icon: Settings },
    ],
    WORKER: [
      { id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "users", label: "Users", icon: Users }, { id: "tickets", label: "Tickets", icon: Ticket },
      { id: "packages", label: "Packages", icon: Package }, { id: "groups", label: "Groups", icon: Users }, { id: "create", label: "Create", icon: Plus },
      { id: "progress", label: "Progress", icon: LineChart }, { id: "chat", label: "Chat", icon: MessageCircle }, { id: "notifications", label: "Notifications", icon: Bell }, { id: "settings", label: "Settings", icon: Settings },
    ],
    GUIDE: [{ id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "groups", label: "My Groups", icon: Users }, { id: "tracking", label: "GPS Tracking", icon: Activity }, { id: "plans", label: "Tour Plans", icon: Layers }, { id: "chat", label: "Chat", icon: MessageCircle }, { id: "notifications", label: "Notifications", icon: Bell }, { id: "settings", label: "Settings", icon: Settings }],
     ADMIN: [{ id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "users", label: "Users", icon: Users }, { id: "tickets", label: "Tickets", icon: Ticket }, { id: "packages", label: "Packages", icon: Package }, { id: "groups", label: "Groups", icon: Users }, { id: "tracking", label: "Tracking", icon: Activity }, { id: "reports", label: "Reports", icon: LineChart }, { id: "reviews", label: "Reviews", icon: ShieldCheck }, { id: "notifications", label: "Notifications", icon: Bell }, { id: "settings", label: "Settings", icon: Settings }],
    TECH: [{ id: "health", label: "System Health", icon: Activity }, { id: "settings", label: "Settings", icon: Settings }],
  };
  const tabs = roleTabs[user.role] ?? roleTabs.CUSTOMER;
  const activeTab = searchParams.get("tab") ?? tabs[0].id;
  const tabHref = (id: string) => `${pathname}?tab=${id}`;

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} fixed inset-y-0 left-0 z-40 flex ${sidebarExpanded ? "w-60" : "w-16"} flex-col bg-togt-navy text-white transition-all duration-300`}>
        <div className={`flex items-center border-b border-white/10 py-5 ${sidebarExpanded ? "gap-2.5 px-5" : "justify-center px-2"}`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-togt-orange">
            <Plane className="h-5 w-5 text-white" />
          </span>
          <div className={sidebarExpanded ? "" : "hidden"}>
            <p className="text-sm font-extrabold leading-tight">TOGT</p>
            <p className="text-[11px] text-white/60 leading-tight">Tour &amp; Travel</p>
          </div>
          <button className="ml-auto hidden rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:block" onClick={() => setSidebarExpanded((value) => !value)} aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"} title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}>{sidebarExpanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className={`rounded-xl bg-white/5 p-3.5 ${sidebarExpanded ? "" : "p-2"}`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-togt-blue to-togt-orange text-sm font-bold">
                {initials}
              </span>
              <div className={`min-w-0 ${sidebarExpanded ? "" : "hidden"}`}>
                <p className="truncate text-sm font-semibold">{user.fullName}</p>
                <p className="truncate text-[11px] text-white/60">{user.email}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className={sidebarExpanded ? "" : "hidden"}><StatusBadge value={user.role} /></div>
            </div>
          </div>
          <nav className="mt-5 space-y-1" aria-label="Dashboard sections">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} title={sidebarExpanded ? undefined : label} onClick={() => { setMobileOpen(false); router.push(tabHref(id), { scroll: false }); }} className={`flex w-full items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-left text-sm transition-colors ${sidebarExpanded ? "" : "justify-center px-2"} ${activeTab === id ? "border-togt-orange bg-white/10 font-semibold text-white" : "border-transparent text-white/65 hover:bg-white/5 hover:text-white"}`}>
                 <Icon className="h-4 w-4 shrink-0" /><span className={sidebarExpanded ? "" : "hidden"}>{label}</span>{id === "chat" && (chatUnread?.unreadCount ?? 0) > 0 && <span className="ml-auto rounded-full bg-togt-orange px-1.5 py-0.5 text-[10px] font-bold text-white">{chatUnread?.unreadCount}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 p-3 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Back to website
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-red-500/20 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      {mobileOpen && <button aria-label="Close dashboard menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/30 lg:hidden" />}
      <div className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${sidebarExpanded ? "lg:ml-60" : "lg:ml-16"}`}>
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/90 px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-3"><button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open dashboard menu"><Menu className="h-5 w-5 text-togt-navy" /></button><p className="text-sm font-semibold text-togt-navy">
            {user.role.charAt(0) + user.role.slice(1).toLowerCase()} Dashboard
          </p></div>
          <div className="flex items-center gap-4">
            <a href={`${pathname}?tab=notifications`} className="relative text-gray-500" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {(unreadNotifications?.unreadCount ?? unread) > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-togt-orange px-1 text-[10px] font-bold text-white">
                  {(unreadNotifications?.unreadCount ?? unread) > 99 ? "99+" : (unreadNotifications?.unreadCount ?? unread)}
                </span>
              )}
            </a>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-togt-blue to-togt-orange text-xs font-bold text-white">
              {initials}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
