"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps { open: boolean; onClose: () => void; title?: string; description?: string; children: ReactNode; size?: "sm" | "md" | "lg" | "xl"; }
const sizeClasses = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export function Dialog({ open, onClose, title, description, children, size = "md" }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onCloseRef.current(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"));
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("button, input, select, textarea, [tabindex]")?.focus());
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); previouslyFocused.current?.focus(); };
  }, [open]);

  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} style={{ backgroundColor: "rgba(18,57,79,0.5)", backdropFilter: "blur(3px)" }}>
    <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={title ? "dialog-title" : undefined} aria-describedby={description ? "dialog-description" : undefined} tabIndex={-1} className={cn("relative flex max-h-[90vh] w-full flex-col rounded-2xl bg-white shadow-2xl", sizeClasses[size])} initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 24 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} onClick={(event) => event.stopPropagation()}>
      {(title || description) && <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4"><div>{title && <h2 id="dialog-title" className="text-lg font-bold text-togt-navy">{title}</h2>}{description && <p id="dialog-description" className="mt-0.5 text-sm text-gray-500">{description}</p>}</div><button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-togt-orange hover:text-white"><X className="h-4 w-4" /></button></div>}
      {!title && !description && <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-togt-orange hover:text-white"><X className="h-4 w-4" /></button>}
      <div className="overflow-y-auto px-6 py-5">{children}</div>
    </motion.div>
  </motion.div>}</AnimatePresence>;
}
