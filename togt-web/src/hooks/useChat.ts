"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import {
  getConversations,
  getChatWorkers,
  getChatUnreadCount,
  getMessages,
  markMessageRead,
  sendMessage,
  startConversation,
} from "@/lib/api/chat";
import { API_URL } from "@/lib/api/client";
import type { ChatMessage } from "@/lib/api/types";
import { useAuth } from "./useAuth";

export function useConversations(params?: { page?: number; search?: string; filter?: string }) {
  return useQuery({
    queryKey: ["chat", "conversations", params ?? {}],
    queryFn: () => getConversations(params),
    refetchInterval: 30_000,
  });
}

export function useChatWorkers() { return useQuery({ queryKey: ["chat", "workers"], queryFn: getChatWorkers }); }
export function useChatUnreadCount() { return useQuery({ queryKey: ["chat", "unread-count"], queryFn: getChatUnreadCount, refetchInterval: 30000 }); }
export function useStartConversation() { const queryClient = useQueryClient(); return useMutation({ mutationFn: startConversation, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] }) }); }

export function useMessages(userId?: string) {
  return useQuery({
    queryKey: ["chat", "messages", userId],
    queryFn: () => getMessages(userId as string),
    enabled: !!userId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => sendMessage(formData),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", message.receiverId] });
    },
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markMessageRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}

/** Live chat via Socket.io — invalidates React Query caches on push events. */
export function useChatSocket(): Socket | null {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (socketRef.current) return;

    const socket = io(API_URL, { withCredentials: true });
    socketRef.current = socket;
    setSocket(socket);

    const onNewMessage = (message: ChatMessage) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", message.senderId] });
    };
    const onRead = () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
    };
    const onRequestUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["request-history"] });
    };
    const onOrderUpdate = () => queryClient.invalidateQueries({ queryKey: ["groups"] });
    const onGroupUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    };
    const onPackageUpdate = () => queryClient.invalidateQueries({ queryKey: ["packages"] });
    socket.on("message:new", onNewMessage);
    socket.on("newMessage", onNewMessage);
    socket.on("newCustomerMessage", onNewMessage);
    socket.on("newWorkerReply", onNewMessage);
    socket.on("workerReplied", onNewMessage);
    socket.on("message:read", onRead);
    socket.on("readReceipt", onRead);
    socket.on("newServiceRequest", onRequestUpdate);
    socket.on("requestReceived", onRequestUpdate);
    socket.on("requestStatusUpdated", onRequestUpdate);
    socket.on("orderCreated", onOrderUpdate);
    socket.on("orderConfirmed", onOrderUpdate);
    socket.on("orderRejected", onOrderUpdate);
    socket.on("orderCompleted", onOrderUpdate);
    socket.on("groupCreated", onGroupUpdate);
    socket.on("groupUpdated", onGroupUpdate);
    socket.on("memberAdded", onGroupUpdate);
    socket.on("memberRemoved", onGroupUpdate);
    socket.on("packageCreated", onPackageUpdate);
    socket.on("packageUpdated", onPackageUpdate);
    socket.on("packageDeleted", onPackageUpdate);
    socket.on("packageAttachedToGroup", onPackageUpdate);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [isAuthenticated, queryClient]);

  return socket;
}
