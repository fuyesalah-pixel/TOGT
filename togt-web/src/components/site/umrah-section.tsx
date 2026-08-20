"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDisplayPackages } from "@/hooks/usePackages";
import { PackageGridSkeleton } from "./package-grid-skeleton";
import { PackageCard } from "./package-card";
import { CustomPackageCard } from "./custom-package-card";
import { PackagesModal } from "@/components/packages/PackagesModal";
import { useSmartForm } from "@/components/smart-form/smart-form-context";
import { motion } from "framer-motion";

export function UmrahSection() {
  const t = useTranslations("Umrah");
  const { openTab } = useSmartForm();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: packages = [], isLoading } = useDisplayPackages({ type: "UMRAH" });
  const homepagePackages = [...packages]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((pkg) => !pkg.isCustom)
    .slice(0, 3);

  return (
    <section id="umrah" className="bg-togt-navy/[0.03] py-20">
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
              Spiritual Journey
            </span>
            <div className="h-[2px] w-8 md:w-10 bg-gradient-to-l from-transparent to-[#FF9300] rounded-full" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#12394F]">
            Umrah <span className="text-[#FF9300]">Packages</span>
          </h2>
          <p className="text-gray-500 mt-4 text-sm md:text-base max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* 4-col grid: 2 on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 justify-items-center">
          {isLoading && <PackageGridSkeleton />}
          {homepagePackages.map((pkg, index) => (
            <PackageCard key={pkg.id} pkg={pkg} tab="umrah" ctaLabel={t("cta")} index={index} />
          ))}
          <CustomPackageCard
            serviceType="umrah"
            tab="umrah"
            ctaLabel={t("customCta")}
          />
        </div>

        {/* See More button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setModalOpen(true)}
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm border-2 border-[#FF9300] text-[#FF9300] overflow-hidden transition-all duration-300 hover:text-white hover:shadow-lg hover:shadow-[#FF9300]/30"
          >
            <span className="absolute inset-0 bg-[#FF9300] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
            <span className="relative z-10">See More Umrah Packages</span>
            <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Gift banner */}
        <div className="mt-10 flex flex-col items-center gap-4 rounded-xl bg-togt-blue p-8 text-center text-white sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <Gift className="h-10 w-10 text-togt-orange" />
            <div>
              <h3 className="text-xl font-semibold">{t("gift")}</h3>
              <p className="text-white/80">{t("giftBody")}</p>
            </div>
          </div>
          <Button
            className="bg-togt-orange text-white hover:bg-togt-orange/90"
            onClick={() => openTab("umrah")}
          >
            {t("cta")}
          </Button>
        </div>
      </div>

      {/* Fullscreen modal */}
      <PackagesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="All Umrah Packages"
        packages={packages}
        tab="umrah"
        ctaLabel={t("cta")}
        customServiceType="umrah"
        customCtaLabel={t("customCta")}
      />
    </section>
  );
}
