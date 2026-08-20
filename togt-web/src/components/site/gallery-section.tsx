"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGallery } from "@/hooks/useContent";
import type { GalleryItem } from "@/lib/api/types";

/** Category badge colors (presentation config) */
const CATEGORY_COLORS: Record<string, string> = {
  UMRAH: "#FF9300",
  DOMESTIC: "#276749",
  TOURIST: "#553C9A",
  EVENT: "#1F67B1",
  VISA: "#C53030",
};

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const PREVIEW_COUNT = 4;

/* ── Gallery detail modal ─────────────────────────────────────────────── */
function GalleryModal({
  item,
  onClose,
}: {
  item: GalleryItem;
  onClose: () => void;
}) {
  /* Lock body scroll + Escape key */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const badgeColor = CATEGORY_COLORS[item.category] ?? "#FF9300";

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 md:p-6 lg:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      aria-hidden="true"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-modal-title"
        className="relative w-full max-w-3xl bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "88vh" }}
        initial={{ opacity: 0, scale: 0.92, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 40 }}
        transition={{ duration: 0.35, ease: EASE }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white mb-1"
              style={{ background: badgeColor }}
            >
              {item.category}
            </span>
            <h3
              id="gallery-modal-title"
              className="text-lg md:text-xl font-extrabold text-[#12394F] leading-tight"
            >
              {item.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close gallery"
            className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 hover:bg-[#FF9300] hover:text-white text-gray-600 flex items-center justify-center transition-all duration-300 ml-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero image */}
          <div className="relative h-52 md:h-72 w-full">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>

          <div className="px-4 md:px-6 py-5 space-y-5">
            {/* Meta */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">
                <Calendar className="w-3 h-3" />
                {item.date}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">
                <MapPin className="w-3 h-3" />
                {item.location}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              {item.description}
            </p>

            {/* Extra images */}
            {item.images.length > 1 && (
              <div>
                <h4 className="font-bold text-[#12394F] text-sm uppercase tracking-wider mb-3">
                  Gallery
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {item.images.map((src, i) => (
                    <div key={i} className="relative h-28 md:h-36 rounded-xl overflow-hidden">
                      <Image
                        src={src}
                        alt={`${item.title} photo ${i + 1}`}
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-500"
                        sizes="200px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {item.videos.length > 0 && (
              <div>
                <h4 className="font-bold text-[#12394F] text-sm uppercase tracking-wider mb-3">
                  Videos
                </h4>
                {item.videos.map((video, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden">
                    <iframe
                      src={video.url}
                      title={video.title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="h-2" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── "All Gallery" modal — grid of all cards ────────────────────────── */
function AllGalleryModal({
  items,
  onClose,
  onSelect,
  browseAll,
  fullGallery,
}: {
  items: GalleryItem[];
  onClose: () => void;
  onSelect: (item: GalleryItem) => void;
  browseAll: string;
  fullGallery: string;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 md:p-6 lg:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      aria-hidden="true"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="All Gallery"
        className="relative w-full max-w-6xl bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "88vh" }}
        initial={{ opacity: 0, scale: 0.92, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 40 }}
        transition={{ duration: 0.35, ease: EASE }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF9300] mb-0.5">
              {browseAll}
            </p>
            <h3 className="text-lg md:text-2xl font-extrabold text-[#12394F]">
              {fullGallery}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close gallery"
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-[#FF9300] hover:text-white text-gray-600 flex items-center justify-center transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {items.map((item, i) => (
              <GalleryCard
                key={item.id}
                item={item}
                index={i}
                onClick={() => { onClose(); onSelect(item); }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Individual gallery card ────────────────────────────────────────── */
function GalleryCard({
  item,
  index,
  onClick,
  viewGalleryLabel,
}: {
  item: GalleryItem;
  index: number;
  onClick: () => void;
  viewGalleryLabel?: string;
}) {
  const badgeColor = CATEGORY_COLORS[item.category] ?? "#FF9300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
      className="group relative cursor-pointer"
      onClick={onClick}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
        {/* Image */}
        <div className="relative h-56 md:h-64 overflow-hidden">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          {/* Text overlay at bottom */}
          <div className="absolute bottom-0 inset-x-0 p-4 md:p-5">
            <span
              className="inline-block px-2.5 py-1 text-white text-[10px] font-bold uppercase tracking-wider rounded-full mb-2"
              style={{ background: badgeColor }}
            >
              {item.category}
            </span>
            <h3 className="text-white font-extrabold text-base md:text-lg leading-tight line-clamp-2">
              {item.title}
            </h3>
            <p className="text-white/60 text-xs mt-1">{item.location}</p>
          </div>
        </div>

        {/* Hover CTA overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          style={{ background: "rgba(255,147,0,0.15)" }}
        >
          <span
            className="bg-white text-[#12394F] font-bold text-sm px-5 py-2.5 rounded-full shadow-xl
                       translate-y-4 group-hover:translate-y-0 transition-transform duration-400"
          >
            {viewGalleryLabel}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main gallery section ───────────────────────────────────────────── */
export function GallerySection() {
  const t = useTranslations("Gallery");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const { data: galleryItems = [], isLoading } = useGallery();
  const preview = galleryItems.slice(0, PREVIEW_COUNT);

  return (
    <section id="gallery" className="py-20 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-12 md:mb-14"
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-[2px] w-10 bg-gradient-to-r from-transparent to-[#FF9300] rounded-full" />
            <span className="text-[#FF9300] font-bold tracking-[0.25em] text-xs uppercase">{t("eyebrow")}</span>
            <div className="h-[2px] w-10 bg-gradient-to-l from-transparent to-[#FF9300] rounded-full" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#12394F]">
            {t("titleMain")} <span className="text-[#FF9300]">{t("titleHighlight")}</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-gray-500 max-w-xl mx-auto">{t("subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 md:h-64 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
          {preview.map((item, i) => (
            <GalleryCard key={item.id} item={item} index={i}
              viewGalleryLabel={t("viewGallery")}
              onClick={() => setSelectedItem(item)} />
          ))}
        </div>

        <div className="flex justify-center mt-10 md:mt-12">
          <button onClick={() => setShowAllModal(true)}
            className="group inline-flex items-center gap-2 px-7 md:px-10 py-3.5 md:py-4 rounded-full font-bold text-sm border-2 border-[#FF9300] text-[#FF9300] overflow-hidden relative transition-all duration-300 hover:text-white hover:shadow-lg hover:shadow-[#FF9300]/30"
          >
            <span className="absolute inset-0 bg-[#FF9300] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
            <span className="relative z-10">{t("seeMore")}</span>
            <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && <GalleryModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAllModal && (
          <AllGalleryModal
            items={galleryItems}
            onClose={() => setShowAllModal(false)}
            onSelect={item => setSelectedItem(item)}
            browseAll={t("browseAll")}
            fullGallery={t("fullGallery")}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
