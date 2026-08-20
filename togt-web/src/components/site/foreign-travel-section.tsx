"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { useDisplayPackages } from "@/hooks/usePackages";
import { PackageGridSkeleton } from "./package-grid-skeleton";
import { PackageCard } from "./package-card";
import { CustomPackageCard } from "./custom-package-card";
import { PackagesModal } from "@/components/packages/PackagesModal";

export function ForeignTravelSection() {
  const t = useTranslations("ForeignTravel");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: packages = [], isLoading } = useDisplayPackages({ type: "FOREIGN" });
  const homepagePackages = [...packages]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((pkg) => !pkg.isCustom)
    .slice(0, 3);

  return (
    <section id="foreign-travel" className="bg-gradient-to-b from-[#FF9300]/[0.04] to-[#1F67B1]/[0.04] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 md:mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-[2px] w-8 rounded-full bg-[#FF9300]" />
            <span className="text-[#FF9300] font-bold tracking-[0.25em] text-xs uppercase">
              {t("eyebrow")}
            </span>
            <div className="h-[2px] w-8 rounded-full bg-[#FF9300]" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-togt-navy">
            {t("title")}<span className="text-[#FF9300]">{t("highlight")}</span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 justify-items-center">
          {isLoading && <PackageGridSkeleton />}
          {homepagePackages.map((pkg, index) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              tab="foreignTravel"
              ctaLabel={t("planTrip")}
              index={index}
            />
          ))}
          <CustomPackageCard
            serviceType="foreign-travel"
            tab="foreignTravel"
            ctaLabel={t("planTrip")}
          />
        </div>

        <div className="flex justify-center mt-10">
          <button
            onClick={() => setModalOpen(true)}
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm border-2 border-[#FF9300] text-[#FF9300] overflow-hidden transition-all duration-300 hover:text-white hover:shadow-lg hover:shadow-[#FF9300]/30"
          >
            <span className="absolute inset-0 bg-[#FF9300] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
            <span className="relative z-10">{t("seeMore")}</span>
            <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      <PackagesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="All Foreign Travel Packages"
        packages={packages}
        tab="foreignTravel"
        ctaLabel={t("planTrip")}
        customServiceType="foreign-travel"
        customCtaLabel={t("planTrip")}
      />
    </section>
  );
}
