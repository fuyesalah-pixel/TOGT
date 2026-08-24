"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  XCircle,
  Star,
  Calendar,
  Users,
  Hotel,
  Bus,
  UserCheck,
  Utensils,
  CreditCard,
} from "lucide-react";
import type { MockPackage } from "@/lib/api/packages";
import type { SmartFormTab } from "@/components/smart-form/smart-form-context";
import { useSmartForm } from "@/components/smart-form/smart-form-context";
import { useAuth } from "@/hooks/useAuth";
import { BookingAccessDialog } from "@/components/site/booking-access-dialog";
import { ImageGallery } from "./ImageGallery";
import { ItineraryTimeline } from "./ItineraryTimeline";

/* ── Detail key → icon map ────────────────────────────────────────────── */
const DETAIL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  duration:      Calendar,
  groupSize:     Users,
  departureDate: Calendar,
  returnDate:    Calendar,
  hotel:         Hotel,
  transport:     Bus,
  guide:         UserCheck,
  meals:         Utensils,
  visa:          CreditCard,
};

/* ── Package type → readable badge ───────────────────────────────────── */
function getTypeBadge(type: string): string {
  if (type.startsWith("umrah"))     return "UMRAH";
  if (type === "domestic_prebuilt") return "DOMESTIC";
  if (type === "tourist_prebuilt")  return "TOURIST";
  return "PACKAGE";
}

/* ── camelCase → "Title Case" ────────────────────────────────────────── */
function formatDetailKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function youtubeId(value?: string) {
  if (!value) return null;
  return value.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)?.[1] ?? null;
}

/* ── Props ────────────────────────────────────────────────────────────── */
interface PackageDetailsModalProps {
  pkg: MockPackage | null;
  tab: SmartFormTab;
  isOpen: boolean;
  onClose: () => void;
}

export function PackageDetailsModal({
  pkg,
  tab,
  isOpen,
  onClose,
}: PackageDetailsModalProps) {
  const { openWithPackage } = useSmartForm();
  const { user } = useAuth();
  const [accessDenied, setAccessDenied] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /* Lock body scroll */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  /* Escape key */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /* Book CTA */
  const handleBook = useCallback(() => {
    if (!pkg) return;
    if (user && user.role !== "CUSTOMER") { setAccessDenied(true); return; }
    onClose();
    setTimeout(() => openWithPackage(tab, pkg), 300);
  }, [pkg, tab, onClose, openWithPackage, user]);

  if (!pkg) return null;

  const detailEntries = Object.entries(pkg.details).filter(([, v]) => v);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          aria-hidden="true"
        >
          {/* Floating modal panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative w-full sm:max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "88dvh" }}
            initial={{ opacity: 0, scale: 0.93, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky close button */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close package details"
              className="absolute top-4 right-4 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {/* Hero image / gallery */}
              <div className="px-4 pt-4 sm:px-6 sm:pt-6">
                <ImageGallery images={pkg.images} alt={pkg.title} />
              </div>

              {/* Title + price header */}
              <div className="px-4 pt-5 sm:px-6">
                <div className="flex flex-wrap items-start gap-3 justify-between">
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest mb-2"
                      style={{
                        background: "rgba(255,147,0,0.12)",
                        color: "#FF9300",
                        border: "1px solid rgba(255,147,0,0.3)",
                      }}
                    >
                      {getTypeBadge(pkg.type)}
                    </span>
                    <h2
                      id="modal-title"
                      className="text-xl sm:text-2xl font-extrabold text-[#12394F] leading-tight"
                    >
                      {pkg.title}
                    </h2>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-extrabold text-[#FF9300]">
                      {pkg.currency} {pkg.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">per person</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-100" />
              </div>

              {/* Content sections */}
              <div className="px-4 sm:px-6 py-5 space-y-7">

                {/* Full description */}
                <p className="whitespace-pre-line text-gray-600 leading-7 text-sm sm:text-base">
                  {pkg.fullDescription}
                </p>

                {youtubeId(pkg.videoUrl) && (
                  <div>
                    <h3 className="mb-3 border-b border-gray-100 pb-2 text-xs font-bold uppercase tracking-wider text-[#12394F]">
                      Package video
                    </h3>
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId(pkg.videoUrl)}`}
                        title={`${pkg.title} video`}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {pkg.highlights.length > 0 && (
                  <div>
                    <h3 className="font-bold text-[#12394F] mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <Star className="w-4 h-4 text-[#FF9300]" />
                      Highlights
                    </h3>
                    <ul className="space-y-2">
                      {pkg.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF9300]" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Included / Excluded */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "rgba(22,163,74,0.06)",
                      border: "1px solid rgba(22,163,74,0.18)",
                    }}
                  >
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-700">
                      <Check className="h-4 w-4" />
                      What&apos;s Included
                    </h3>
                    <ul className="space-y-2">
                      {pkg.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "rgba(220,38,38,0.05)",
                      border: "1px solid rgba(220,38,38,0.14)",
                    }}
                  >
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
                      <XCircle className="h-4 w-4" />
                      Not Included
                    </h3>
                    <ul className="space-y-2">
                      {pkg.excluded.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Package details grid */}
                {detailEntries.length > 0 && (
                  <div>
                    <h3 className="font-bold text-[#12394F] mb-3 text-xs uppercase tracking-wider">
                      Package Details
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {detailEntries.map(([key, value]) => {
                        const Icon = DETAIL_ICONS[key] ?? Calendar;
                        return (
                          <div
                            key={key}
                            className="flex items-start gap-3 rounded-xl p-3"
                            style={{
                              background: "rgba(31,103,177,0.05)",
                              border: "1px solid rgba(31,103,177,0.12)",
                            }}
                          >
                            <Icon className="w-4 h-4 text-[#1F67B1] flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-400 font-medium">
                                {formatDetailKey(key)}
                              </p>
                              <p className="text-sm text-[#12394F] font-semibold leading-tight">
                                {value}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Itinerary timeline */}
                {pkg.itinerary && pkg.itinerary.length > 0 && (
                  <div>
                    <h3 className="font-bold text-[#12394F] mb-4 text-xs uppercase tracking-wider">
                      Day-by-Day Itinerary
                    </h3>
                    <ItineraryTimeline itinerary={pkg.itinerary} />
                  </div>
                )}

                <div className="h-2" />
              </div>
            </div>

            {/* Sticky Book CTA */}
            <div
              className="flex-shrink-0 px-4 py-4 sm:px-6"
              style={{
                borderTop: "1px solid rgba(0,0,0,0.08)",
                background: "white",
                boxShadow: "0 -4px 20px rgba(0,0,0,0.07)",
              }}
            >
              <button
                onClick={handleBook}
                className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #FF9300 0%, #e07d00 100%)",
                  boxShadow: "0 4px 20px rgba(255,147,0,0.38)",
                }}
              >
                Book This Package
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {accessDenied && user && user.role !== "CUSTOMER" && <BookingAccessDialog role={user.role} onClose={() => setAccessDenied(false)} />}
    </AnimatePresence>
  );
}
