"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { useDisplayPackages } from "@/hooks/usePackages";
import { PackageGridSkeleton } from "./package-grid-skeleton";
import { PackageCard } from "./package-card";
import { CustomPackageCard } from "./custom-package-card";
import { PackagesModal } from "@/components/packages/PackagesModal";

export function ForeignerSection() {
  const t = useTranslations("Foreigner");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: packages = [], isLoading } = useDisplayPackages({ type: "TOURIST" });
  const homepagePackages = [...packages]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((pkg) => !pkg.isCustom)
    .slice(0, 3);

  return (
    <section id="foreigner" className="bg-togt-navy/[0.03] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-togt-navy sm:text-4xl">{t("title")}</h2>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 justify-items-center">
          {isLoading && <PackageGridSkeleton />}
          {homepagePackages.map((pkg, index) => (
            <PackageCard key={pkg.id} pkg={pkg} tab="tourist" ctaLabel={t("customCta")} index={index} />
          ))}
          <CustomPackageCard
            serviceType="tourist"
            tab="tourist"
            ctaLabel={t("customCta")}
          />
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={() => setModalOpen(true)}
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm border-2 border-[#FF9300] text-[#FF9300] overflow-hidden transition-all duration-300 hover:text-white hover:shadow-lg hover:shadow-[#FF9300]/30"
          >
            <span className="absolute inset-0 bg-[#FF9300] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
            <span className="relative z-10">See More Tourist Tours</span>
            <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      <PackagesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="All Tourist Tours"
        packages={packages}
        tab="tourist"
        ctaLabel={t("customCta")}
        customServiceType="tourist"
        customCtaLabel={t("customCta")}
      />
    </section>
  );
}

