import { api, apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { Notification, NotificationType } from "./types";

export function getNotifications(): Promise<Notification[]> {
  return apiGet<Notification[]>("/notifications");
}

export function markNotificationRead(id: string): Promise<Notification> {
  return apiPatch<Notification>(`/notifications/${id}/read`);
}

export function getUnreadNotificationCount(): Promise<{ unreadCount: number }> {
  return apiGet<{ unreadCount: number }>("/notifications/unread-count");
}

export function confirmDevice(id: string): Promise<Notification> {
  return apiPatch<Notification>(`/notifications/${id}/confirm-device`);
}

export function deleteNotification(id: string): Promise<Notification> {
  return apiDelete<Notification>(`/notifications/${id}`);
}

export function clearNotifications(): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>("/notifications");
}

export function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>("/notifications/read-all", { method: "PATCH" });
}

export interface BulkNotificationPayload {
  target?: "all" | "individual" | "selected" | "group" | "service_type" | "role";
  userIds?: string[];
  groupId?: string;
  serviceType?: string;
  role?: string;
  title: string;
  message: string;
  type: NotificationType;
  channel?: string;
}

export function sendBulkNotification(
  dto: BulkNotificationPayload,
): Promise<{ sent: number }> {
  return apiPost<{ sent: number }>("/notifications/bulk", dto);
}
