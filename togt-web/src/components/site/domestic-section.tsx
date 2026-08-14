"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { mockPackages } from "@/lib/data/packages";
import { PackageCard } from "./package-card";
import { CustomPackageCard } from "./custom-package-card";
import { PackagesModal } from "@/components/packages/PackagesModal";
import { motion } from "framer-motion";

export function DomesticSection() {
  const t = useTranslations("Domestic");
  const [modalOpen, setModalOpen] = useState(false);

  const packages = mockPackages.filter((p) => p.type === "domestic_prebuilt");

  return (
    <section id="domestic" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Unified section header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-[2px] w-8 md:w-10 bg-gradient-to-r from-transparent to-[#FF9300] rounded-full" />
            <span className="text-[#FF9300] font-semibold tracking-[0.25em] text-xs md:text-sm uppercase">
              Explore Ethiopia
            </span>
            <div className="h-[2px] w-8 md:w-10 bg-gradient-to-l from-transparent to-[#FF9300] rounded-full" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#12394F]">
            Domestic <span className="text-[#FF9300]">Tours</span>
          </h2>
          <p className="text-gray-500 mt-4 text-sm md:text-base max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 justify-items-center">
          {packages.map((pkg, index) => (
            <PackageCard key={pkg.id} pkg={pkg} tab="domestic" ctaLabel={t("customCta")} index={index} />
          ))}
          <CustomPackageCard
            serviceType="domestic"
            tab="domestic"
            ctaLabel={t("customCta")}
          />
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={() => setModalOpen(true)}
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm border-2 border-[#FF9300] text-[#FF9300] overflow-hidden transition-all duration-300 hover:text-white hover:shadow-lg hover:shadow-[#FF9300]/30"
          >
            <span className="absolute inset-0 bg-[#FF9300] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
            <span className="relative z-10">See More Domestic Tours</span>
            <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      <PackagesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="All Domestic Tours"
        packages={packages}
        tab="domestic"
        ctaLabel={t("customCta")}
        customServiceType="domestic"
        customCtaLabel={t("customCta")}
      />
    </section>
  );
}

