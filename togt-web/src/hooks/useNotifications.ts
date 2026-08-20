"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadNotificationCount,
  confirmDevice,
  deleteNotification,
  clearNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  sendBulkNotification,
  type BulkNotificationPayload,
} from "@/lib/api/notifications";

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30_000,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({ queryKey: ["notifications", "unread-count"], queryFn: getUnreadNotificationCount, refetchInterval: 30000 });
}

export function useNotificationActions() {
  const queryClient = useQueryClient();
  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ["notifications"] }); };
  return {
    confirmDevice: useMutation({ mutationFn: confirmDevice, onSuccess: invalidate }),
    deleteNotification: useMutation({ mutationFn: deleteNotification, onSuccess: invalidate }),
    clearNotifications: useMutation({ mutationFn: clearNotifications, onSuccess: invalidate }),
  };
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useSendBulkNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkNotificationPayload) => sendBulkNotification(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
