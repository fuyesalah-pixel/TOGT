"use client";

import {
  Sparkles,
  Mountain,
  Globe,
  Plane,
  FileCheck2,
  Check,
} from "lucide-react";
import type { SmartFormTab } from "@/components/smart-form/smart-form-context";
import { useSmartForm } from "@/components/smart-form/smart-form-context";

/* ── Per-type config ────────────────────────────────────────────────────── */
interface CustomCardConfig {
  badge: string;
  badgeColor: string;         // bg color for badge pill
  badgeTextColor: string;
  iconBg: string;             // bg for icon circle
  iconColor: string;          // icon stroke color
  accentBorder: string;       // dashed border color
  title: string;
  description: string;
  bullets: string[];
  Icon: React.ComponentType<{ className?: string }>;
}

const CONFIGS: Record<string, CustomCardConfig> = {
  umrah: {
    badge: "CUSTOM UMRAH",
    badgeColor: "rgba(255,215,0,0.18)",
    badgeTextColor: "#B7791F",
    iconBg: "rgba(255,215,0,0.12)",
    iconColor: "#B7791F",
    accentBorder: "border-yellow-400/50",
    title: "Build Your Own Umrah Package",
    description:
      "Design your perfect spiritual journey. Choose your own dates, hotel, transportation, and group size. Our team will create a personalized Umrah experience tailored to your needs and budget.",
    bullets: [
      "Choose your travel dates",
      "Select hotel tier — Economy to 5-star",
      "Pick group size — solo, family, or group",
      "Optional dedicated Imam guidance",
      "Flexible budget options available",
    ],
    Icon: Sparkles,
  },
  domestic: {
    badge: "CUSTOM DOMESTIC TOUR",
    badgeColor: "rgba(56,161,105,0.15)",
    badgeTextColor: "#276749",
    iconBg: "rgba(56,161,105,0.10)",
    iconColor: "#276749",
    accentBorder: "border-green-500/50",
    title: "Design Your Dream Ethiopian Adventure",
    description:
      "Tell us where you want to go and we will handle everything else. Whether it is a school trip, honeymoon, friends vacation, or corporate retreat — we create a custom domestic tour just for you.",
    bullets: [
      "Any destination across Ethiopia",
      "Select your travel dates",
      "Choose accommodation type — hotel, resort, or camp",
      "Solo to large group sizes welcome",
      "Multi-lingual guides available",
    ],
    Icon: Mountain,
  },
  tourist: {
    badge: "CUSTOM ETHIOPIA TOUR",
    badgeColor: "rgba(128,90,213,0.15)",
    badgeTextColor: "#553C9A",
    iconBg: "rgba(128,90,213,0.10)",
    iconColor: "#553C9A",
    accentBorder: "border-purple-500/50",
    title: "Your Personalized Ethiopia Experience",
    description:
      "Experience Ethiopia your way. From airport pickup to departure, we create a fully customized itinerary based on your interests — history, culture, nature, or adventure.",
    bullets: [
      "Airport-to-airport full service",
      "Choose your own destinations",
      "Multi-lingual guide — English, Arabic, French, and more",
      "Flexible duration — 2 days to 3+ weeks",
      "Accommodation of your choice",
    ],
    Icon: Globe,
  },
  ticket: {
    badge: "CUSTOM FLIGHT REQUEST",
    badgeColor: "rgba(31,103,177,0.12)",
    badgeTextColor: "#1F67B1",
    iconBg: "rgba(31,103,177,0.08)",
    iconColor: "#1F67B1",
    accentBorder: "border-blue-500/50",
    title: "Need a Specific Flight?",
    description:
      "Tell us your exact flight requirements — dates, routes, airline preference, or budget constraints. Our IATA-certified team will find the best available options for you.",
    bullets: [
      "Any destination worldwide",
      "Multi-city routes available",
      "Group booking discounts",
      "IATA-certified ticketing service",
      "Refund assistance per IATA rules",
    ],
    Icon: Plane,
  },
  visa: {
    badge: "CUSTOM VISA ASSISTANCE",
    badgeColor: "rgba(229,62,62,0.12)",
    badgeTextColor: "#C53030",
    iconBg: "rgba(229,62,62,0.08)",
    iconColor: "#C53030",
    accentBorder: "border-red-500/50",
    title: "Not Sure About Your Visa?",
    description:
      "Tell us your travel plans and we will guide you through the correct visa type, required documents, and application process. We handle visit, medical, and family visas.",
    bullets: [
      "Visit visa assistance",
      "Medical and hospital visa",
      "Family visa sponsorship",
      "Document review and translation",
      "Application tracking and follow-up",
    ],
    Icon: FileCheck2,
  },
};

/* ── Component ──────────────────────────────────────────────────────────── */
interface CustomPackageCardProps {
  serviceType: "umrah" | "domestic" | "tourist" | "ticket" | "visa";
  tab: SmartFormTab;
  ctaLabel: string;
  heightClass?: string;
  /** Called before opening smart form — used to close parent modal first */
  onBeforeBook?: () => void;
}

export function CustomPackageCard({
  serviceType,
  tab,
  ctaLabel,
  heightClass = "h-[360px] lg:h-[420px]",
  onBeforeBook,
}: CustomPackageCardProps) {
  const { openTab } = useSmartForm();
  const cfg = CONFIGS[serviceType];
  if (!cfg) return null;

  const { Icon } = cfg;

  const handleBook = () => {
    if (onBeforeBook) {
      onBeforeBook();
      setTimeout(() => openTab(tab), 320);
    } else {
      openTab(tab);
    }
  };

  return (
    <div
      className={`group relative w-full flex flex-col rounded-[32px] overflow-hidden border-2 border-dashed bg-white ${cfg.accentBorder} ${heightClass} p-4 lg:p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up`}
    >
      {/* Badge */}
      <span
        className="inline-block self-start px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-3"
        style={{
          background: cfg.badgeColor,
          color: cfg.badgeTextColor,
          border: `1px solid ${cfg.badgeTextColor}33`,
        }}
      >
        {cfg.badge}
      </span>

      {/* Icon */}
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: cfg.iconBg }}
      >
        <span style={{ color: cfg.iconColor }}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm lg:text-base font-bold text-[#12394F] leading-snug mb-3 line-clamp-2">
        {cfg.title}
      </h3>

      {/* 3 bullets only */}
      <ul className="flex-1 space-y-1.5 mb-4">
        {cfg.bullets.slice(0, 3).map((b, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
            <span style={{ color: cfg.iconColor }} className="flex-shrink-0 mt-0.5">
              <Check className="h-3 w-3" />
            </span>
            <span className="line-clamp-1">{b}</span>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <button
        onClick={handleBook}
        className="w-full py-2 rounded-xl font-bold text-white text-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
        style={{
          background: "linear-gradient(135deg, #FF9300 0%, #e07d00 100%)",
          boxShadow: "0 4px 16px rgba(255,147,0,0.32)",
        }}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
