"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CheckCircle, ArrowDown, ChevronUp } from "lucide-react";
import { testimonials } from "@/lib/data/testimonials";

const PAGE_SIZE = 3;
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ── Star row with sequential pop-in ───────────────────────────────── */
function StarRow({ rating, cardIndex }: { rating: number; cardIndex: number }) {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, rotate: -30 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ delay: cardIndex * 0.1 + i * 0.06, duration: 0.3, ease: EASE }}
        >
          <Star
            className={`h-4 w-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ── Single testimonial card ────────────────────────────────────────── */
function TestimonialCard({
  rev,
  index,
}: {
  rev: (typeof testimonials)[number];
  index: number;
}) {
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: (index % PAGE_SIZE) * 0.1, ease: EASE }}
      whileHover={{ y: -5, transition: { duration: 0.22 } }}
      className="group h-full"
    >
      <div className="relative h-full bg-white rounded-2xl shadow-md hover:shadow-2xl transition-shadow duration-500 overflow-hidden flex flex-col p-5 md:p-6">
        {/* Gradient top accent on hover */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#1F67B1] via-[#FF9300] to-[#1F67B1] opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

        {/* Decorative quote mark */}
        <div className="absolute top-3 right-5 text-7xl font-serif text-[#1F67B1]/5 group-hover:text-[#FF9300]/10 transition-colors duration-500 select-none leading-none pointer-events-none">
          &ldquo;
        </div>

        <StarRow rating={rev.rating} cardIndex={index} />

        <p className="flex-1 italic text-gray-600 leading-relaxed mb-5 text-xs md:text-sm line-clamp-5">
          &ldquo;{rev.text}&rdquo;
        </p>

        <div className="h-px bg-gradient-to-r from-gray-200 via-gray-100 to-transparent mb-4" />

        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full font-bold text-white text-sm shadow-md"
            style={{ background: "linear-gradient(135deg, #1F67B1 0%, #FF9300 100%)" }}
          >
            {getInitials(rev.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#12394F] text-sm truncate">{rev.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-400 truncate">{rev.service}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0" />
              <span className="flex items-center gap-0.5 text-xs text-green-500 flex-shrink-0">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main section ───────────────────────────────────────────────────── */
export function TestimonialsSection() {
  const t = useTranslations("Testimonials");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [hasExpanded, setHasExpanded] = useState(false);

  const visible = testimonials.slice(0, visibleCount);
  const hasMore = visibleCount < testimonials.length;

  const handleShowMore = () => {
    setVisibleCount((c) => c + PAGE_SIZE);
    setHasExpanded(true);
  };
  const handleShowLess = () => {
    setVisibleCount(PAGE_SIZE);
    setHasExpanded(false);
  };

  return (
    <section
      id="testimonials"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(31,103,177,0.03) 0%, rgba(255,147,0,0.02) 100%)",
      }}
    >
      {/* Decorative blob */}
      <div
        className="absolute top-20 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{
          background: "rgba(255,147,0,0.06)",
          animation: "aurora-drift-2 18s ease-in-out infinite",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="mb-12 md:mb-16 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-[2px] w-10 bg-gradient-to-r from-transparent to-[#FF9300] rounded-full" />
            <span className="text-[#FF9300] font-bold tracking-[0.25em] text-xs uppercase">
              Testimonials
            </span>
            <div className="h-[2px] w-10 bg-gradient-to-l from-transparent to-[#FF9300] rounded-full" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#12394F]">
            {t("title").split(" ").slice(0, -2).join(" ")}{" "}
            <span className="text-[#FF9300]">{t("title").split(" ").slice(-2).join(" ")}</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-gray-500">
            Verified reviews from our valued customers
          </p>
        </motion.div>

        {/* Grid — always 3 columns on lg, no row-span */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {visible.map((rev, index) => (
            <TestimonialCard key={rev.id} rev={rev} index={index} />
          ))}
        </div>

        {/* Buttons — See More and Show Less side by side */}
        <div className="mt-10 md:mt-14 flex flex-wrap items-center justify-center gap-3 md:gap-4">

          {/* See More — visible while more exist */}
          <AnimatePresence>
            {hasMore && (
              <motion.button
                key="see-more"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                onClick={handleShowMore}
                className="group relative inline-flex items-center gap-2.5 px-7 md:px-10 py-3.5 md:py-4 rounded-full font-bold text-sm border-2 border-[#FF9300] text-[#FF9300] overflow-hidden hover:text-white transition-colors duration-300 hover:shadow-xl hover:shadow-[#FF9300]/30"
              >
                <span className="absolute inset-0 bg-[#FF9300] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative z-10">{t("seeMore")}</span>
                <ArrowDown className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-y-1" />
                <span className="relative z-10 text-xs opacity-60">
                  ({visibleCount} of {testimonials.length})
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Show Less — visible after first See More click */}
          <AnimatePresence>
            {hasExpanded && (
              <motion.button
                key="show-less"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                onClick={handleShowLess}
                className="group inline-flex items-center gap-2 px-7 md:px-10 py-3.5 md:py-4 rounded-full font-bold text-sm text-white transition-all duration-300 hover:shadow-xl hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #1F67B1 0%, #12394F 100%)" }}
              >
                <span>Show Less</span>
                <ChevronUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-1" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* All shown message when none left to load and never expanded more */}
          {!hasMore && !hasExpanded && testimonials.length <= PAGE_SIZE && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2 text-[#12394F]"
            >
              <CheckCircle className="h-5 w-5 text-[#FF9300]" />
              <p className="text-sm font-semibold">All {testimonials.length} reviews shown</p>
            </motion.div>
          )}

        </div>

      </div>
    </section>
  );
}
