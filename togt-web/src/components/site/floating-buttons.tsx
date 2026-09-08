"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { streamChatbot } from "@/lib/api/chatbot";
import { CONTACT } from "@/lib/contact";
import { RichText } from "./rich-text";

type PackageCard = { id: string; title: string; description: string; image?: string | null; price?: number | null; currency?: string | null; duration?: string | null; includes?: string[] };
type Message = { from: "user" | "bot"; text: string; packages?: PackageCard[] };

export function FloatingButtons() {
  const t = useTranslations("Floating");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [conversationId] = useState(() => `web-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [messages, setMessages] = useState<Message[]>([{ from: "bot", text: "Hi! I can help with packages, Umrah, tickets, visas, tours, booking, and payment." }]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, typing]);
  useEffect(() => { if (!typing) return; const timer = window.setInterval(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 500); return () => window.clearInterval(timer); }, [typing]);
  const send = async (event?: FormEvent, preset?: string) => {
    event?.preventDefault();
    const text = (preset ?? draft).trim();
    if (!text || typing) return;
    setDraft("");
    setMessages((current) => [...current, { from: "user", text }, { from: "bot", text: "" }]);
    setTyping(true);
    try {
      await streamChatbot(text, conversationId, (chunk, packages) => setMessages((current) => {
        const next = [...current];
        const last = next.length - 1;
        next[last] = { ...next[last], text: next[last].text + chunk, ...(packages ? { packages } : {}) };
        return next;
      }));
    } catch {
      setMessages((current) => {
        const next = [...current];
        next[next.length - 1] = { from: "bot", text: `I could not reach the assistant. Please call ${CONTACT.phones[0].display} or email ${CONTACT.email}.` };
        return next;
      });
    } finally {
      setTyping(false);
    }
  };
  const book = (pkg: PackageCard) => {
    window.dispatchEvent(new CustomEvent("selectService", { detail: "umrah" }));
    document.getElementById("smart-form")?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
    void pkg;
  };
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <button onClick={() => setOpen((value) => !value)} aria-label={t("ai")} className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-togt-blue text-white shadow-lg transition-transform hover:scale-105">
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
      {open && (
        <div className="order-first flex h-[31rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-togt-blue/10 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-togt-navy to-togt-blue p-4 text-white">
            <div>
              <p className="font-bold">TOGT Assistant</p>
              <p className="text-xs text-white/70">Online · replies instantly</p>
            </div>
            <Bot className="h-5 w-5" />
          </div>
          <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto scroll-smooth p-3">
            {messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={`${message.from === "user" ? "ml-auto bg-togt-blue text-white" : "bg-slate-100 text-togt-navy"} max-w-[95%] rounded-xl p-3 text-sm`} id={`chat-msg-${index}`}>
                {message.from === "bot" ? <RichText text={message.text} /> : <p className="leading-relaxed">{message.text}</p>}
                {message.packages?.length ? (
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                    {message.packages.slice(0, 5).map((pkg) => (
                      <article key={pkg.id} className="w-56 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white text-togt-navy shadow-sm">
                        <img src={pkg.image || "/images/packages/umrah-economy.jpg"} alt={pkg.title} className="h-24 w-full object-cover" />
                        <div className="p-3">
                          <h4 className="text-sm font-bold">{pkg.title}</h4>
                          <p className="mt-1 text-xs font-bold text-togt-orange">{pkg.duration || "Flexible duration"} · {pkg.price ? `${pkg.price.toLocaleString()} ${pkg.currency || "ETB"}` : "Custom pricing"}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{pkg.description}</p>
                          <div className="mt-2 flex gap-2">
                            <button onClick={() => book(pkg)} className="flex-1 rounded-lg bg-togt-orange py-1.5 text-xs font-bold text-white transition-colors hover:bg-togt-orange/90">Book Now</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {typing && <div className="flex items-center gap-1 text-togt-navy/70"><span className="h-2 w-2 animate-bounce rounded-full bg-togt-blue" /><span className="h-2 w-2 animate-bounce rounded-full bg-togt-blue [animation-delay:150ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-togt-blue [animation-delay:300ms]" /></div>}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={send} className="flex items-center gap-2 border-t border-gray-100 p-3">
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type a message…" className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-togt-blue" />
            <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-full bg-togt-blue text-white transition-opacity hover:opacity-85 disabled:opacity-40" disabled={!draft.trim() || typing}><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}
      <button onClick={() => { window.dispatchEvent(new CustomEvent("selectService", { detail: "consultation" })); document.getElementById("smart-form")?.scrollIntoView({ behavior: "smooth" }); setOpen(false); }} aria-label={t("phone")} className="flex h-14 w-14 items-center justify-center rounded-full bg-togt-orange text-white shadow-lg transition-transform hover:scale-105"><MessageCircle className="h-6 w-6" /></button>
    </div>
  );
}