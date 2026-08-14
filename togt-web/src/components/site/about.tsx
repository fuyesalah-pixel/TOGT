"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function About() {
  const t = useTranslations("About");

  return (
    <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">

      {/* Unified section header */}
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
            About Us
          </span>
          <div className="h-[2px] w-8 md:w-10 bg-gradient-to-l from-transparent to-[#FF9300] rounded-full" />
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#12394F]">
          Who We <span className="text-[#FF9300]">Are</span>
        </h2>
        <p className="text-gray-500 mt-4 text-sm md:text-base max-w-2xl mx-auto">
          Your trusted, IATA-accredited travel partner in Addis Ababa, Ethiopia
        </p>
      </motion.div>

      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">{t("body")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="aspect-video overflow-hidden rounded-xl border border-togt-blue/10 bg-togt-navy/5 shadow-sm"
        >
          <iframe
            className="h-full w-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title={t("videoTitle")}
            loading="lazy"
            allowFullScreen
          />
        </motion.div>
      </div>
    </section>
  );
}
