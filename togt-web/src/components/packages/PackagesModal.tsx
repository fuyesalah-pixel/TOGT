"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { MockPackage } from "@/lib/data/packages";
import type { SmartFormTab } from "@/components/smart-form/smart-form-context";
import { PackageCard } from "@/components/site/package-card";
import { CustomPackageCard } from "@/components/site/custom-package-card";

interface PackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  packages: MockPackage[];
  tab: SmartFormTab;
  ctaLabel: string;
  customServiceType?: "umrah" | "domestic" | "tourist" | "ticket" | "visa" | "foreign-travel";
  customCtaLabel?: string;
}

export function PackagesModal({
  isOpen,
  onClose,
  title,
  packages,
  tab,
  ctaLabel,
  customServiceType,
  customCtaLabel,
}: PackagesModalProps) {
  /* Lock body scroll */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  /* Escape key */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /* Close modal first, then let card's own booking logic run */
  const handleBeforeBook = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center p-3 md:p-6 lg:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          aria-hidden="true"
          style={{ backgroundColor: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-6xl bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "88vh" }}
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sticky header */}
            <div className="flex-shrink-0 sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF9300] mb-0.5">Browse All</p>
                <h3 className="text-lg md:text-2xl font-extrabold text-[#12394F]">{title}</h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-[#FF9300] hover:text-white text-gray-600 flex items-center justify-center transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable package grid */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 justify-items-center">
                {packages.map((pkg, i) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    tab={tab}
                    ctaLabel={ctaLabel}
                    index={i}
                    onBeforeBook={handleBeforeBook}
                  />
                ))}
                {customServiceType && customCtaLabel && (
                  <CustomPackageCard
                    serviceType={customServiceType}
                    tab={tab}
                    ctaLabel={customCtaLabel}
                    onBeforeBook={handleBeforeBook}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
