"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Convert any YouTube URL (watch, youtu.be, shorts, or already-embedded) to an embed URL. */
function toYouTubeEmbed(value?: string | null): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const match = raw.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  // Accept a raw embed URL as-is.
  if (raw.includes("youtube.com/embed/")) return raw;
  return null;
}

export function About() {
  const t = useTranslations("About");
  const settings = useSiteSettings();

  const videoEmbed = toYouTubeEmbed(settings.ABOUT_VIDEO_URL);
  // Admin-managed text (ABOUT_TEXT) overrides the translated default when set.
  const body = settings.ABOUT_TEXT.trim() || t("body");

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

      <div className={`grid gap-10 ${videoEmbed ? "lg:grid-cols-2 lg:items-center" : ""}`}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="text-base md:text-lg text-gray-600 leading-relaxed whitespace-pre-line">{body}</p>
        </motion.div>
        {videoEmbed && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="group/video relative aspect-video overflow-hidden rounded-2xl bg-black shadow-[0_20px_50px_-12px_rgba(18,57,79,0.35)] ring-1 ring-black/10"
          >
            {/* YouTube-style player chrome: top gradient + red play glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-black/60 to-transparent opacity-70" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-black/60 to-transparent opacity-70" />
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/video:opacity-100">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF0000] shadow-2xl transition-transform duration-300 group-hover/video:scale-110">
                <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 fill-white" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`${videoEmbed}?rel=0&modestbranding=1&playsinline=1`}
              title={t("videoTitle")}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}
