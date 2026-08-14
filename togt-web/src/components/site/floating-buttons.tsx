"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle, Bot, X } from "lucide-react";

export function FloatingButtons() {
  const t = useTranslations("Floating");
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {aiOpen && (
        <div className="mb-2 w-72 rounded-xl border border-togt-blue/10 bg-white p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-togt-navy">TOGT AI Assistant</p>
            <button onClick={() => setAiOpen(false)} aria-label="Close">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Hi! I&apos;m here to help with Umrah packages, tours, tickets, and visa
            questions. (AI chat coming soon \u2014 full RAG assistant is a later phase.)
          </p>
        </div>
      )}

      <button
        onClick={() => setAiOpen((v) => !v)}
        aria-label={t("ai")}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-togt-blue text-white shadow-lg transition-transform hover:scale-105"
      >
        <Bot className="h-6 w-6" />
      </button>

      <a
        href="https://wa.me/251900000000"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("whatsapp")}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}
