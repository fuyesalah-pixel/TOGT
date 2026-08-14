"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, Crown, Heart, Mountain, Palmtree,
  Landmark, Building2, Plane, Info,
} from "lucide-react";
import type { MockPackage } from "@/lib/data/packages";
import { useSmartForm, type SmartFormTab } from "@/components/smart-form/smart-form-context";
import { PackageDetailsModal } from "@/components/packages/PackageDetailsModal";

const getIconForPackage = (title: string) => {
  if (title.includes("Economy")) return Wallet;
  if (title.includes("VIP") || title.includes("Premium")) return Crown;
  if (title.includes("Honeymoon") || title.includes("Couple")) return Heart;
  if (title.includes("Northern") || title.includes("Explorer")) return Mountain;
  if (title.includes("Southern") || title.includes("Adventure")) return Palmtree;
  if (title.includes("Historical") || title.includes("Circuit")) return Landmark;
  if (title.includes("City")) return Building2;
  return Plane;
};

export function PackageCard({
  pkg,
  tab,
  ctaLabel,
  index = 0,
  onBeforeBook,
}: {
  pkg: MockPackage;
  tab: SmartFormTab;
  ctaLabel: string;
  index?: number;
  /** Called before opening smart form — used to close parent modal first */
  onBeforeBook?: () => void;
}) {
  const { openWithPackage } = useSmartForm();
  const IconComponent = getIconForPackage(pkg.title);
  const [modalOpen, setModalOpen] = useState(false);
  const moreInfoRef = useRef<HTMLButtonElement>(null);

  const description = pkg.includes.slice(0, 3).join(" • ");

  const handleModalClose = () => {
    setModalOpen(false);
    setTimeout(() => moreInfoRef.current?.focus(), 50);
  };

  const handleBook = () => {
    if (onBeforeBook) {
      onBeforeBook();
      setTimeout(() => openWithPackage(tab, pkg), 320);
    } else {
      openWithPackage(tab, pkg);
    }
  };

  return (
    <>
      <div
        className="group relative w-full rounded-[32px] overflow-hidden shadow-xl bg-cover bg-center h-[360px] lg:h-[420px] transition-all duration-500 hover:shadow-2xl animate-fade-in-up"
        style={{
          backgroundImage: `url('${pkg.image}')`,
          animationDelay: `${Math.min(index * 100, 900)}ms`,
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url('${pkg.image}')` }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Package type icon */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-togt-orange/90 backdrop-blur-sm text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
            <IconComponent className="h-6 w-6" />
          </div>
        </div>

        <div className="absolute bottom-0 p-4 lg:p-6 w-full flex flex-col gap-2 lg:gap-3 z-20">
          <h2 className="text-white text-base lg:text-xl font-bold leading-tight line-clamp-2">{pkg.title}</h2>

          <p className="text-white/90 text-xs lg:text-sm leading-relaxed line-clamp-2">
            {description}
          </p>

          {/* Badges */}
          <div className="flex gap-1.5 flex-wrap items-center">
            <Badge className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-xs border-0 font-medium">
              {pkg.durationDays} {pkg.durationDays === 1 ? "Day" : "Days"}
            </Badge>

            {tab === "umrah" && pkg.type.includes("vip") && (
              <Badge className="bg-togt-orange/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-xs border-0 font-medium">
                Premium
              </Badge>
            )}

            <Badge className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-xs border-0 font-medium ml-auto">
              {pkg.currency} {Math.round(pkg.price / 100) * 100}
            </Badge>
          </div>

          {/* Buttons — always stacked vertically */}
          <div className="flex flex-col gap-2 mt-1">
            {/* Book Now */}
            <Button
              className="w-full bg-[#FF9300] hover:bg-orange-600 text-white font-bold py-2.5 text-xs rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 border-0 h-auto"
              onClick={handleBook}
            >
              {ctaLabel}
            </Button>

            {/* More Info */}
            <button
              ref={moreInfoRef}
              onClick={() => setModalOpen(true)}
              aria-label={`More info about ${pkg.title}`}
              className="w-full flex items-center justify-center gap-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 active:scale-95 hover:bg-white/25 border border-white/50 text-white"
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Modal — rendered at this level to avoid z-index / stacking context issues */}
      <PackageDetailsModal
        pkg={pkg}
        tab={tab}
        isOpen={modalOpen}
        onClose={handleModalClose}
      />
    </>
  );
}
