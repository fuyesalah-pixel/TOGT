"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useSmartForm } from "@/components/smart-form/smart-form-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useFaq } from "@/hooks/useContent";
import { ArrowRight, Plus, Minus } from "lucide-react";

export function FaqSection() {
  const t = useTranslations("Faq");
  const { openTab } = useSmartForm();
  const { data: faqItems = [], isLoading } = useFaq();

  return (
    <section id="faq" className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-white via-gray-50/60 to-white">
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(31,103,177,0.07)", animation: "aurora-drift-1 14s ease-in-out infinite" }} />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(255,147,0,0.07)", animation: "aurora-drift-3 16s ease-in-out infinite" }} />

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

        <motion.div className="mb-12 md:mb-16 text-center"
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-[2px] w-10 bg-gradient-to-r from-transparent to-[#FF9300] rounded-full" />
            <span className="text-[#FF9300] font-bold tracking-[0.25em] text-xs uppercase">{t("eyebrow")}</span>
            <div className="h-[2px] w-10 bg-gradient-to-l from-transparent to-[#FF9300] rounded-full" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#12394F]">
            {t("title").split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-[#FF9300]">{t("title").split(" ").slice(-1)}</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-gray-500 max-w-md mx-auto">{t("subtitle")}</p>
        </motion.div>

        <Accordion className="w-full space-y-3 md:space-y-4">
          {isLoading && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl border border-gray-200 bg-white/80" />
          ))}
          {faqItems.map((item, index) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <AccordionItem value={item.id}
                className="group relative rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm overflow-hidden shadow-sm
                           data-[state=open]:border-[#FF9300]/40 data-[state=open]:shadow-xl data-[state=open]:shadow-[#1F67B1]/8
                           hover:border-[#FF9300]/30 hover:shadow-md transition-all duration-300"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#1F67B1] to-[#FF9300] rounded-r-full
                                scale-y-0 group-data-[state=open]:scale-y-100 transition-transform duration-500 origin-top" />
                <AccordionTrigger className="w-full flex items-center justify-between gap-4 px-5 md:px-7 py-4 md:py-5 text-left hover:no-underline [&>svg]:hidden">
                  <span className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300
                                     bg-gray-100 text-gray-400
                                     group-data-[state=open]:bg-gradient-to-br group-data-[state=open]:from-[#1F67B1] group-data-[state=open]:to-[#12394F] group-data-[state=open]:text-white group-data-[state=open]:shadow-md
                                     group-hover:bg-[#FF9300]/10 group-hover:text-[#FF9300]">
                      <Plus className="h-4 w-4 group-data-[state=open]:hidden" />
                      <Minus className="h-4 w-4 hidden group-data-[state=open]:block" />
                    </span>
                    <span className="font-semibold text-sm md:text-base text-[#12394F] transition-colors duration-300 group-data-[state=open]:text-[#1F67B1] group-hover:text-[#1F67B1]">
                      {item.question}
                    </span>
                  </span>
                  <span className="flex-shrink-0 w-5 h-5 text-gray-400 transition-all duration-300 group-data-[state=open]:text-[#FF9300] group-data-[state=open]:rotate-180 group-hover:text-[#FF9300]">
                    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div className="px-5 md:px-7 pb-5 md:pb-6 pl-[4.5rem] md:pl-20">
                    <div className="h-px bg-gradient-to-r from-[#FF9300]/25 via-gray-200 to-transparent mb-4" />
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>

        <motion.div className="mt-12 md:mt-16 text-center"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-gray-400 text-sm mb-5">{t("contactCta")}</p>
          <button onClick={() => openTab("contact")}
            className="group inline-flex items-center gap-2 px-7 md:px-9 py-3.5 md:py-4 rounded-full font-semibold text-sm text-white shadow-lg shadow-blue-900/20 hover:shadow-xl hover:scale-105 transition-all duration-300"
            style={{ background: "linear-gradient(135deg, #1F67B1 0%, #12394F 100%)" }}
          >
            <span>{t("contactButton")}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </motion.div>

      </div>
    </section>
  );
}

