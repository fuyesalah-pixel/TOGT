"use client";

import { useTranslations } from "next-intl";
import { FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSmartForm } from "@/components/smart-form/smart-form-context";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function VisaSection() {
  const t = useTranslations("Visa");
  const { openTab } = useSmartForm();

  return (
    <section id="visa" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">

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
            Hassle-Free Visas
          </span>
          <div className="h-[2px] w-8 md:w-10 bg-gradient-to-l from-transparent to-[#FF9300] rounded-full" />
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#12394F]">
          Visa <span className="text-[#FF9300]">Processing</span>
        </h2>
        <p className="text-gray-500 mt-4 text-sm md:text-base max-w-2xl mx-auto">
          We handle the paperwork so you can focus on your journey
        </p>
      </motion.div>

      <motion.div
        className="grid gap-10 rounded-2xl border border-togt-blue/10 bg-white p-8 md:p-10 shadow-sm lg:grid-cols-[auto_1fr] lg:items-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
      >
        <FileCheck2 className="h-16 w-16 text-togt-blue" />
        <div>
          <p className="max-w-2xl text-gray-600 leading-relaxed">{t("body")}</p>
          <Button
            className="mt-6 bg-togt-blue text-white hover:bg-togt-blue/90"
            onClick={() => openTab("visa")}
          >
            {t("cta")}
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
