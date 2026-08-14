"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck, Award, Headset } from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function WhyTogt() {
  const t = useTranslations("WhyTogt");

  const items = [
    { icon: Award,       title: t("iata"),       body: t("iataBody")       },
    { icon: ShieldCheck, title: t("experience"), body: t("experienceBody") },
    { icon: Headset,     title: t("support"),    body: t("supportBody")    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">

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
            Why Choose Us
          </span>
          <div className="h-[2px] w-8 md:w-10 bg-gradient-to-l from-transparent to-[#FF9300] rounded-full" />
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#12394F]">
          Why TOGT Is <span className="text-[#FF9300]">Different</span>
        </h2>
        <p className="text-gray-500 mt-4 text-sm md:text-base max-w-2xl mx-auto">
          What sets us apart from every other travel agency
        </p>
      </motion.div>

      <div className="grid gap-8 sm:grid-cols-3">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            className="text-center"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-togt-blue/10">
              <item.icon className="h-8 w-8 text-togt-blue" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-togt-navy">{item.title}</h3>
            <p className="mt-2 text-muted-foreground">{item.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
