"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useInView } from "framer-motion";
import { Globe, TrendingUp, Award } from "lucide-react";

/* ── Animated counter ───────────────────────────────────────────────────── */
interface CounterProps {
  end: number;
  suffix?: string;
  label: string;
  sublabel?: string;
  duration?: number;
}

function Counter({ end, suffix = "", label, sublabel, duration = 2000 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-4 rounded-2xl px-5 py-4
                 sm:flex-col sm:items-center sm:text-center sm:gap-2 sm:px-6 sm:py-5"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.09)",
      }}
    >
      <span
        className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-none tabular-nums flex-shrink-0"
        style={{ color: "#FF9300" }}
      >
        {count}
        <span className="text-3xl sm:text-4xl lg:text-5xl">{suffix}</span>
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-semibold uppercase tracking-wider text-white leading-tight">
          {label}
        </span>
        {sublabel && (
          <span className="mt-0.5 text-xs text-white/40">{sublabel}</span>
        )}
      </div>
    </div>
  );
}

/* ── Airline data with real image paths ─────────────────────────────────── */
const AIRLINES = [
  { name: "Emirates",          src: "/images/airlines/emirates.jpg" },
  { name: "Qatar Airways",     src: "/images/airlines/qatar-airways.jpg" },
  { name: "Turkish Airlines",  src: "/images/airlines/turkish-airlines.jpg" },
  { name: "Saudia",            src: "/images/airlines/saudia.jpg" },
  { name: "EgyptAir",          src: "/images/airlines/egyptair.jpg" },
  { name: "Air Canada",        src: "/images/airlines/air-canada.jpg" },
  { name: "Air France",        src: "/images/airlines/air-france.jpg" },
  { name: "American Airlines", src: "/images/airlines/american-airlines.jpg" },
  { name: "British Airways",   src: "/images/airlines/british-airways.jpg" },
  { name: "Delta Air Lines",   src: "/images/airlines/delta.jpg" },
];

/* ── Main component ───────────────────────────────────────────────────── */
export function IATASection() {
  // Duplicate for seamless infinite loop
  const track = [...AIRLINES, ...AIRLINES];

  return (
    <section
      id="iata"
      className="relative overflow-hidden py-16 md:py-20"
      style={{
        background: "linear-gradient(135deg, #0a2233 0%, #12394F 50%, #1a3d5c 100%)",
      }}
    >
      {/* Dot-grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Orange glow accent */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,147,0,0.12) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="mb-10 md:mb-14 text-center">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#FF9300]" />
          <div className="inline-flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-[#FF9300]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF9300]">
              IATA Accredited Member Agency
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
            Proud IATA Member Agency
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-sm md:text-base text-white/60 leading-relaxed px-2">
            We work with the International Air Transport Association (IATA) —
            connecting you to over 370 member airlines across 120+ countries,
            covering 85% of global air traffic.
          </p>
        </div>

        {/* ── Counters — responsive grid ───────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-2xl mx-auto mb-12 md:mb-16">
          <Counter end={370} suffix="+" label="Member Airlines"    sublabel="worldwide"       duration={1800} />
          <Counter end={120} suffix="+" label="Countries"          sublabel="served globally"  duration={1600} />
          <Counter end={85}  suffix="%" label="Global Air Traffic" sublabel="coverage"         duration={1400} />
        </div>

        {/* ── Airline logo marquee ─────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Globe className="w-4 h-4 text-white/35" />
            <p className="text-xs font-semibold uppercase tracking-widest text-white/35">
              Our Partner Airlines
            </p>
            <Globe className="w-4 h-4 text-white/35" />
          </div>

          {/* Edge-fade mask + overflow clip */}
          <div
            className="relative overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
            }}
          >
            <div className="marquee-track">
              {track.map((airline, i) => (
                <div
                  key={`${airline.name}-${i}`}
                  className="flex-shrink-0 flex items-center justify-center
                             w-40 h-20 rounded-xl overflow-hidden
                             bg-white
                             opacity-90 hover:opacity-100
                             hover:scale-105
                             transition-all duration-300 cursor-default"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
                >
                  <Image
                    src={airline.src}
                    alt={airline.name}
                    width={140}
                    height={60}
                    className="object-contain w-auto h-12 p-1"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-white/25">
            and 360+ more IATA member airlines worldwide
          </p>
        </div>

        {/* ── Trust badges ─────────────────────────────────────────── */}
        <div className="mt-12 md:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {[
            {
              Icon: Award,
              title: "IATA Accredited",
              body: "Direct access to official airline ticketing systems — no middlemen, transparent fares.",
            },
            {
              Icon: TrendingUp,
              title: "Transparent Fares",
              body: "Best available fares through the official IATA distribution network.",
            },
            {
              Icon: Globe,
              title: "Global Reach",
              body: "Book flights to any destination served by IATA member carriers.",
            },
          ].map(({ Icon, title, body }) => (
            <div
              key={title}
              className="flex items-start gap-3 md:gap-4 rounded-2xl p-4 md:p-5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="flex-shrink-0 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,147,0,0.15)" }}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 text-[#FF9300]" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{title}</p>
                <p className="mt-1 text-xs text-white/50 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
