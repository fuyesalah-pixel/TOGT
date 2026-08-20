"use client";

import { useMemo, useState } from "react";
import type { NotificationType, Role, ServiceType } from "@/lib/api/types";
import { useSendBulkNotification } from "@/hooks/useNotifications";
import { useGroups } from "@/hooks/useGroups";
import { useUsers } from "@/hooks/useUsers";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const TYPES: NotificationType[] = ["SYSTEM", "STATUS_UPDATE", "NEW_PACKAGE", "CHAT_MESSAGE", "ALERT"];
const roles: Role[] = ["CUSTOMER", "WORKER", "GUIDE", "ADMIN", "TECH"];
const services: ServiceType[] = ["UMRAH", "TICKET", "DOMESTIC", "TOURIST", "VISA", "FOREIGN_TRAVEL"];

export function BulkNotificationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sendBulk = useSendBulkNotification();
  const { data: groups } = useGroups();
  const [target, setTarget] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const { data: users } = useUsers({ search: userSearch || undefined, limit: 30 });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [form, setForm] = useState({ title: "", message: "", type: "SYSTEM" as NotificationType, groupId: "", serviceType: "UMRAH" as ServiceType, role: "CUSTOMER" as Role });
  const [channels, setChannels] = useState({ IN_APP: true, EMAIL: false, SMS: false });
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number | null>(null);
  const channelValue = useMemo(() => Object.entries(channels).filter(([, enabled]) => enabled).map(([name]) => name).join(",") || "IN_APP", [channels]);

  const submit = async () => {
    setError(null); setSent(null);
    if (!form.title.trim() || !form.message.trim()) return setError("Title and message are required");
    if ((target === "individual" || target === "selected") && selectedUsers.length === 0) return setError("Select at least one user");
    try {
      const result = await sendBulk.mutateAsync({ target: target as "all" | "individual" | "selected" | "group" | "service_type" | "role", userIds: selectedUsers, groupId: form.groupId || undefined, serviceType: form.serviceType, role: form.role, title: form.title.trim(), message: form.message.trim(), type: form.type, channel: channelValue });
      setSent(result.sent);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to send notification"); }
  };

  return <Dialog open={open} onClose={onClose} title="Send Notification" size="lg"><div className="space-y-4">
    <div><Label>Send to</Label><select value={target} onChange={(event) => setTarget(event.target.value)} className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"><option value="all">All users</option><option value="individual">Individual user</option><option value="selected">Selected users</option><option value="group">Group members</option><option value="service_type">By service type</option><option value="role">By role</option></select></div>
    {(target === "individual" || target === "selected") && <div><Input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search name, email, or phone" /><div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-gray-100">{users?.data.map((user) => <label key={user.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"><input type={target === "individual" ? "radio" : "checkbox"} checked={selectedUsers.includes(user.id)} onChange={() => setSelectedUsers(target === "individual" ? [user.id] : selectedUsers.includes(user.id) ? selectedUsers.filter((id) => id !== user.id) : [...selectedUsers, user.id])} />{user.fullName} <span className="text-xs text-gray-400">{user.email}</span></label>)}</div></div>}
    {target === "group" && <div><Label>Group</Label><select value={form.groupId} onChange={(event) => setForm({ ...form, groupId: event.target.value })} className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"><option value="">Choose group...</option>{groups?.map((group) => <option key={group.id} value={group.id}>{group.name} ({group.members.length} members)</option>)}</select></div>}
    {target === "service_type" && <div><Label>Service type</Label><select value={form.serviceType} onChange={(event) => setForm({ ...form, serviceType: event.target.value as ServiceType })} className="h-8 w-full rounded-lg border border-input px-2.5 text-sm">{services.map((service) => <option key={service}>{service}</option>)}</select></div>}
    {target === "role" && <div><Label>Role</Label><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })} className="h-8 w-full rounded-lg border border-input px-2.5 text-sm">{roles.map((role) => <option key={role}>{role}</option>)}</select></div>}
    <div><Label>Channels</Label><div className="flex flex-wrap gap-4 text-sm">{(["IN_APP", "EMAIL", "SMS"] as const).map((channel) => <label key={channel} className="flex items-center gap-2"><input type="checkbox" checked={channels[channel]} onChange={(event) => setChannels({ ...channels, [channel]: event.target.checked })} />{channel.replace("_", " ")}</label>)}</div></div>
    <div><Label>Title</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div><div><Label>Message</Label><Textarea rows={4} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></div><div><Label>Type</Label><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as NotificationType })} className="h-8 w-full rounded-lg border border-input px-2.5 text-sm">{TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
    {error && <p className="text-sm text-red-600">{error}</p>}{sent !== null && <p className="text-sm text-emerald-600">Sent to {sent} users.</p>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={() => void submit()} disabled={sendBulk.isPending} className="bg-togt-orange text-white">{sendBulk.isPending ? "Sending..." : "Send Notification"}</Button></div>
  </div></Dialog>;
}
