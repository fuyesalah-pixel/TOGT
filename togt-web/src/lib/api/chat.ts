import { apiGet, apiPatch, apiPost, apiUpload } from "./client";
import type { ChatMessage, PaginatedConversations, User } from "./types";

export function getConversations(params?: { page?: number; search?: string; filter?: string }): Promise<PaginatedConversations> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.search) query.set("search", params.search);
  if (params?.filter && params.filter !== "all") query.set("filter", params.filter);
  return apiGet<PaginatedConversations>(`/chat/conversations${query.toString() ? `?${query}` : ""}`);
}

export function getChatWorkers(): Promise<User[]> { return apiGet<User[]>("/chat/workers"); }
export function getChatUnreadCount(): Promise<{ unreadCount: number }> { return apiGet<{ unreadCount: number }>("/chat/unread-count"); }
export function startConversation(dto: { receiverId?: string; channel?: "support" | "worker" }) { return apiPost<{ id: string; workerId?: string }>("/chat/start", dto); }

export function getMessages(userId: string): Promise<ChatMessage[]> {
  return apiGet<ChatMessage[]>(`/chat/${userId}/messages`);
}

/** formData fields: receiverId, message, optional file */
export function sendMessage(formData: FormData): Promise<ChatMessage> {
  return apiUpload<ChatMessage>("/chat/send", formData);
}

export function markMessageRead(id: string): Promise<ChatMessage> {
  return apiPatch<ChatMessage>(`/chat/${id}/read`);
}
