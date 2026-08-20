"use client";

import { Fragment, useEffect, useRef, useState } from "react";

import { FileText, Paperclip, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useChatSocket,
  useConversations,
  useMarkMessageRead,
  useMessages,
  useSendMessage,
} from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { MAX_UPLOAD_BYTES } from "@/lib/api/uploads";
import { LoadingSpinner } from "./loading-spinner";
import { EmptyState } from "./empty-state";
import { PageHeader } from "./page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useStartConversation } from "@/hooks/useChat";

export function ChatTab({ initialUserId, initialMessage }: { initialUserId?: string; initialMessage?: string }) {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(initialUserId);
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationFilter, setConversationFilter] = useState<"all" | "unread" | "read">("all");
  const [conversationPage, setConversationPage] = useState(1);
  const [allUsersOpen, setAllUsersOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refundStarted = useRef(false);

  const socket = useChatSocket();
  const { data: conversationPageData, isLoading } = useConversations({ page: conversationPage, search: user?.role === "CUSTOMER" ? undefined : conversationSearch, filter: user?.role === "CUSTOMER" ? undefined : conversationFilter });
  const conversations = conversationPageData?.data ?? [];
  const startConversation = useStartConversation();
  const { data: messages } = useMessages(selectedUserId);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessageRead();

  useEffect(() => {
    if (initialUserId) setSelectedUserId(initialUserId);
    if (initialMessage) setDraft(initialMessage);
  }, [initialUserId, initialMessage]);

  useEffect(() => {
    if (!initialMessage || selectedUserId || refundStarted.current || user?.role !== "CUSTOMER" || startConversation.isPending) return;
    refundStarted.current = true;
    startConversation.mutate({ channel: "support" }, { onSuccess: (conversation) => setSelectedUserId(conversation.workerId) });
  }, [initialMessage, selectedUserId, user?.role, startConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket || !user?.id) return;
    const onTyping = (payload: { fromUserId?: string; isTyping?: boolean }) => {
      if (payload.fromUserId === selectedUserId) setTypingUser(Boolean(payload.isTyping));
    };
    socket.on("typing", onTyping);
    return () => { socket.off("typing", onTyping); };
  }, [socket, selectedUserId, user?.id]);

  // Mark incoming messages as read when viewing a thread
  useEffect(() => {
    if (!messages || !user) return;
      messages
      .filter((m) => !m.isRead && (m.receiverId === user.id || (user.role !== "CUSTOMER" && m.sender?.role === "CUSTOMER")))
      .forEach((m) => markRead.mutate(m.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, user?.id]);

  const selectedConversation = conversations?.find((c) => c.user.id === selectedUserId);
  const visibleConversations = conversations;

  const handleSend = async () => {
    if (!selectedUserId || (!draft.trim() && !file)) return;
    setError(null);
    if (file && file.size > MAX_UPLOAD_BYTES) {
      setError("File exceeds the 10MB limit");
      return;
    }
    const formData = new FormData();
    formData.append("receiverId", selectedUserId);
    formData.append("message", draft.trim());
    if (file) formData.append("file", file);
    try {
      await sendMessage.mutateAsync(formData);
      setDraft("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  return (
    <div>
      <PageHeader title="Chat" description="Real-time messaging" />
      <div className="chat-container grid min-h-0 grid-cols-1 gap-4 overflow-hidden md:grid-cols-3" style={{ height: "calc(100vh - 240px)" }}>
        {/* Conversations */}
        <div className="chat-sidebar flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {user?.role === "CUSTOMER" && <div className="border-b border-gray-100 p-3"><Button onClick={() => setNewChatOpen(true)} className="w-full bg-togt-orange text-white hover:bg-togt-orange/90">+ New Chat</Button></div>}
          {user?.role !== "CUSTOMER" && <div className="space-y-2 border-b border-gray-100 p-3"><div className="relative"><Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input value={conversationSearch} onChange={(event) => { setConversationSearch(event.target.value); setConversationPage(1); }} placeholder="Search name or email" className="pl-8" /></div><select value={conversationFilter} onChange={(event) => { setConversationFilter(event.target.value as typeof conversationFilter); setConversationPage(1); }} className="h-8 w-full rounded-lg border border-input px-2 text-xs"><option value="all">All conversations</option><option value="unread">Unread</option><option value="read">Read</option></select></div>}
          <div className="chat-user-list min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <LoadingSpinner />
          ) : visibleConversations.length === 0 ? (
            <EmptyState title="No conversations" description="Messages will appear here." />
          ) : (
            visibleConversations.map((c) => (
              <button
                key={c.user.id}
                onClick={() => setSelectedUserId(c.user.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors",
                  selectedUserId === c.user.id ? "bg-togt-blue/5" : "hover:bg-slate-50",
                )}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-togt-blue to-togt-orange text-xs font-bold text-white">
                  {c.user.fullName.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-togt-navy">{c.user.fullName}</p>
                    <span className="flex-shrink-0 text-[10px] text-gray-400">
                      {c.lastMessage ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {c.lastMessage?.message || (c.lastMessage ? "📎 File" : "No messages yet")}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-togt-orange px-1.5 text-[10px] font-bold text-white">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
          </div>
          {user?.role !== "CUSTOMER" && conversationPageData && conversationPageData.total > 30 && <button onClick={() => setAllUsersOpen(true)} className="m-3 w-[calc(100%-1.5rem)] rounded-lg border border-togt-blue px-3 py-2 text-xs font-semibold text-togt-blue">See All Users ({conversationPageData.total})</button>}
        </div>

        {/* Thread */}
        <div className="chat-messages-area flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm md:col-span-2">
          {!selectedUserId ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState title="Select a conversation" description="Choose a chat from the list." />
            </div>
          ) : (
            <>
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-togt-navy"><span className="h-2 w-2 rounded-full bg-emerald-500" />{selectedConversation?.user.fullName ?? "Conversation"}</p>
                <p className="text-[11px] text-gray-400">{typingUser ? "Typing..." : selectedConversation?.user.email}</p>
              </div>

              <div className="chat-messages-scroll min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
                {messages?.map((m, index) => {
                  const own = m.senderId === user?.id;
                  const currentDay = new Date(m.createdAt).toDateString();
                  const previousDay = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
                  return (
                    <Fragment key={m.id}>
                      {currentDay !== previousDay && <div className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">{currentDay === new Date().toDateString() ? "Today" : currentDay}</div>}
                      <div className={cn("flex", own ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm", own ? "rounded-br-sm bg-togt-orange text-white" : "rounded-bl-sm border border-gray-100 bg-white text-togt-navy")}>
                          {m.message && <p className="whitespace-pre-wrap break-words">{m.message}</p>}
                          {m.fileUrl && <a href={m.fileUrl} target="_blank" rel="noreferrer" className={cn("mt-1 flex items-center gap-1.5 text-xs underline", own ? "text-white/90" : "text-togt-blue")}><FileText className="h-3.5 w-3.5" />Attachment</a>}
                          <p className={cn("mt-1 flex items-center justify-end gap-1 text-[10px]", own ? "text-white/70" : "text-gray-400")}>
                            {user?.role !== "CUSTOMER" && m.sender?.role === "WORKER" && <span className="mr-auto font-medium">{own ? "You" : m.sender.fullName}</span>}
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {own && <span className={m.isRead ? "font-bold text-sky-200" : ""}>{m.isRead ? "✓✓" : "✓"}</span>}
                          </p>
                        </div>
                      </div>
                    </Fragment>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="chat-input-area flex-shrink-0 border-t border-gray-100 p-3">
                {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
                {file && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-gray-600">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="truncate">{file.name}</span>
                    <button className="ml-auto text-red-500" onClick={() => setFile(null)}>
                      Remove
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach file"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={draft}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDraft(value);
                      if (socket && selectedUserId) {
                        socket.emit("typing", { toUserId: selectedUserId, isTyping: Boolean(value) });
                        if (typingTimer.current) clearTimeout(typingTimer.current);
                        typingTimer.current = setTimeout(() => socket.emit("typing", { toUserId: selectedUserId, isTyping: false }), 1200);
                      }
                    }}
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={sendMessage.isPending || (!draft.trim() && !file)}
                    className="bg-togt-blue text-white hover:bg-togt-blue/90"
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Dialog open={newChatOpen} onClose={() => setNewChatOpen(false)} title="Start New Conversation" size="sm">
        <div className="space-y-3">
          <button onClick={() => startConversation.mutate({ channel: "support" }, { onSuccess: (conversation) => { setSelectedUserId(conversation.workerId); setNewChatOpen(false); } })} className="w-full rounded-xl border border-gray-100 p-4 text-left hover:border-togt-orange"><p className="font-semibold text-togt-navy">Chat with TOGT Support</p><p className="text-xs text-gray-500">General help and travel questions.</p></button>
        </div>
      </Dialog>
      <Dialog open={allUsersOpen} onClose={() => setAllUsersOpen(false)} title="All Customer Conversations" size="lg">
        <div className="space-y-3"><p className="text-sm text-gray-500">Showing page {conversationPage} of {conversationPageData?.totalPages ?? 1} ({conversationPageData?.total ?? 0} users)</p>{visibleConversations.map((conversation) => <button key={conversation.user.id} onClick={() => { setSelectedUserId(conversation.user.id); setAllUsersOpen(false); }} className="flex w-full items-center gap-3 rounded-lg border border-gray-100 p-3 text-left hover:bg-slate-50"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-togt-blue text-xs font-bold text-white">{conversation.user.fullName.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block font-semibold text-togt-navy">{conversation.user.fullName}</span><span className="block truncate text-xs text-gray-500">{conversation.user.email}</span></span>{conversation.unreadCount > 0 && <span className="rounded-full bg-togt-orange px-2 py-1 text-xs font-bold text-white">{conversation.unreadCount} unread</span>}</button>)}<div className="flex items-center justify-between"><Button variant="outline" disabled={conversationPage <= 1} onClick={() => setConversationPage((page) => page - 1)}>Previous</Button><Button variant="outline" disabled={!conversationPageData || conversationPage >= conversationPageData.totalPages} onClick={() => setConversationPage((page) => page + 1)}>Next</Button></div></div>
      </Dialog>
    </div>
  );
}
