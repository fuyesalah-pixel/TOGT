"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/** Modal dialog following the codebase's overlay + framer-motion pattern. */
export function Dialog({ open, onClose, title, description, children, size = "md" }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{ backgroundColor: "rgba(18,57,79,0.5)", backdropFilter: "blur(3px)" }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative w-full bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]",
              sizeClasses[size],
            )}
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
                <div>
                  {title && (
                    <h2 className="text-lg font-bold text-togt-navy">{title}</h2>
                  )}
                  {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-togt-orange hover:text-white text-gray-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
