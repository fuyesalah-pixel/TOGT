"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { LuxuryVideoPlayer } from "./luxury-video";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function About() {
  const t = useTranslations("About");
  const locale = useLocale();
  const settings = useSiteSettings();

  const videoUrl = settings.ABOUT_VIDEO_URL.trim() || null;
  // Admin-managed text (ABOUT_TEXT) overrides the translated default when
  // set. On ar/am/om the auto-translated copy stored at save time is served;
  // it falls back to the source text until the AI translation has landed.
  const stored = locale === "ar" ? settings.ABOUT_TEXT_AR : locale === "am" ? settings.ABOUT_TEXT_AM : locale === "om" ? settings.ABOUT_TEXT_OM : "";
  const body = (locale === "en" ? settings.ABOUT_TEXT : stored.trim() || settings.ABOUT_TEXT.trim()) || t("body");

  return (
    <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        className="text-center mb-12 md:mb-16"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-[2px] w-8 md:w-10 bg-gradient-to-r from-transparent to-[#FF9300] rounded-full" />
          <span className="text-[#FF9300] font-semibold tracking-[0.25em] text-xs md:text-sm uppercase">
            {t("eyebrow")}
          </span>
          <div className="h-[2px] w-8 md:w-10 bg-gradient-to-l from-transparent to-[#FF9300] rounded-full" />
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#12394F]">
          {t("titleMain")} <span className="text-[#FF9300]">{t("titleHighlight")}</span>
        </h2>
        <p className="text-gray-500 mt-4 text-sm md:text-base max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </motion.div>

      <div className={`grid gap-10 ${videoUrl ? "lg:grid-cols-2 lg:items-center" : ""}`}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="text-base md:text-lg text-gray-600 leading-relaxed whitespace-pre-line">{body}</p>
        </motion.div>
        {videoUrl && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          >
            <LuxuryVideoPlayer url={videoUrl} title={t("videoTitle")} className="rounded-2xl shadow-[0_20px_50px_-12px_rgba(18,57,79,0.35)] ring-1 ring-black/10" />
          </motion.div>
        )}
      </div>
    </section>
  );
}
