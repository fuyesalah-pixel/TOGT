"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ── Social icon button ─────────────────────────────────────────────── */
function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#FF9300] flex items-center justify-center transition-all duration-300 hover:scale-110"
    >
      {children}
    </a>
  );
}

/* ── Footer link ────────────────────────────────────────────────────── */
function FooterLink({ href, children, external = false }: { href: string; children: React.ReactNode; external?: boolean }) {
  return (
    <li>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="text-white/55 hover:text-[#FF9300] text-sm transition-colors duration-200 inline-flex items-center gap-1 group"
      >
        {children}
        {external && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </a>
    </li>
  );
}

/* ── Column heading ─────────────────────────────────────────────────── */
function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-white font-bold text-xs uppercase tracking-[0.22em] mb-5 flex items-center gap-2">
      <span className="w-4 h-[2px] rounded-full bg-[#FF9300]" />
      {children}
    </h4>
  );
}

export function Footer() {
  const t   = useTranslations("Footer");
  const nav = useTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-[#0e2d3f] text-white overflow-hidden">

      {/* Orange gradient top border */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#1F67B1] via-[#FF9300] to-[#1F67B1]" />

      {/* Subtle dot-grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Faint blue glow — bottom left */}
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(31,103,177,0.12) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 md:pt-16 pb-8">

        {/* ── Main grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-12 mb-10">

          {/* ── Brand — spans 2 cols on lg ───────────────────── */}
          <motion.div
            className="lg:col-span-2 space-y-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Image
                  src="/images/logo/TOGT_Tour_Travel_Final Logo Png.png"
                  alt="TOGT Tour and Travel"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-white font-extrabold text-xl tracking-wide">TOGT</span>
                <span className="block text-white/50 text-[10px] tracking-[0.25em] uppercase">Tour & Travel</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-white/55 text-sm leading-relaxed max-w-xs">
              Your trusted, IATA-certified travel partner in Addis Ababa, Ethiopia. Specialising in ticketing, Umrah packages, domestic and international tours, and visa services.
            </p>

            {/* IATA badge */}
            <div
              className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
              style={{ background: "rgba(255,147,0,0.12)", border: "1px solid rgba(255,147,0,0.25)" }}
            >
              <span className="text-[#FF9300] font-extrabold text-xs tracking-widest uppercase">IATA</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="text-white/55 text-xs">Accredited Agency</span>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2.5">
              {/* Facebook */}
              <SocialLink href="https://facebook.com/togt" label="Facebook">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </SocialLink>

              {/* Instagram */}
              <SocialLink href="https://instagram.com/togt" label="Instagram">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                </svg>
              </SocialLink>

              {/* Telegram */}
              <SocialLink href="https://t.me/togt" label="Telegram">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </SocialLink>

              {/* TikTok */}
              <SocialLink href="https://tiktok.com/@togt" label="TikTok">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.22 8.22 0 004.86 1.57V6.81a4.85 4.85 0 01-1.09-.12z" />
                </svg>
              </SocialLink>

              {/* YouTube */}
              <SocialLink href="https://youtube.com/@togt" label="YouTube">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </SocialLink>
            </div>
          </motion.div>

          {/* ── Services ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          >
            <ColHeading>Services</ColHeading>
            <ul className="space-y-2.5">
              <FooterLink href="#ticket">Flight Ticketing</FooterLink>
              <FooterLink href="#umrah">{nav("umrah")}</FooterLink>
              <FooterLink href="#domestic">{nav("domestic")}</FooterLink>
              <FooterLink href="#foreigner">{nav("foreigner")}</FooterLink>
              <FooterLink href="#visa">{nav("visa")}</FooterLink>
              <FooterLink href="#smart-form">Travel Consulting</FooterLink>
            </ul>
          </motion.div>

          {/* ── Quick Links ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.14, ease: EASE }}
          >
            <ColHeading>Quick Links</ColHeading>
            <ul className="space-y-2.5">
              <FooterLink href="#about">{nav("about")}</FooterLink>
              <FooterLink href="#iata">Why TOGT</FooterLink>
              <FooterLink href="#gallery">Gallery</FooterLink>
              <FooterLink href="#faq">FAQ</FooterLink>
              <FooterLink href="#testimonials">Reviews</FooterLink>
              <FooterLink href="#smart-form">Contact Us</FooterLink>
            </ul>
          </motion.div>

          {/* ── Contact ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          >
            <ColHeading>{t("contact")}</ColHeading>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF9300] flex-shrink-0 mt-0.5" />
                <span className="text-white/55 text-sm leading-snug">
                  Bole Road, Addis Ababa, Ethiopia
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FF9300] flex-shrink-0" />
                <a href="tel:+251900000000" className="text-white/55 hover:text-[#FF9300] text-sm transition-colors">
                  +251 900 000 000
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FF9300] flex-shrink-0" />
                <a href="mailto:info@togt.com" className="text-white/55 hover:text-[#FF9300] text-sm transition-colors">
                  info@togt.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#FF9300] flex-shrink-0 mt-0.5" />
                <span className="text-white/55 text-sm leading-snug">
                  Mon – Sat: 8:00 AM – 7:00 PM
                </span>
              </li>
            </ul>
          </motion.div>

        </div>

        {/* ── Resources row ────────────────────────────────────── */}
        <motion.div
          className="border-t border-white/8 pt-8 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
        >
          <ColHeading>Resources</ColHeading>
          <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
            <FooterLink href="/blog" external>Travel Blog</FooterLink>
            <FooterLink href="/umrah-guide">Umrah Guide</FooterLink>
            <FooterLink href="/visa-requirements">Visa Requirements</FooterLink>
            <FooterLink href="/terms">Terms &amp; Conditions</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/refund-policy">Refund Policy</FooterLink>
            <FooterLink href="/support">Customer Support</FooterLink>
          </ul>
        </motion.div>

        {/* ── Bottom bar ───────────────────────────────────────── */}
        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-xs md:text-sm">
            &copy; {year} TOGT Tour &amp; Travel. {t("rights")}
          </p>
          <p className="text-white/25 text-xs">
            IATA Accredited Agency &middot; Addis Ababa, Ethiopia
          </p>
        </div>

      </div>
    </footer>
  );
}
