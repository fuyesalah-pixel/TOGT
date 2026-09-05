"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("#about");
  const lastScrollY = useRef(0);
  const { user, isAuthenticated, logout } = useAuth();
  useEffect(() => {
    const handleScroll = () => { const current = window.scrollY; setScrolled(current > 50); if (open) { setIsVisible(true); lastScrollY.current = current; return; } setIsVisible(current < lastScrollY.current || current < 100); lastScrollY.current = current; };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [open]);
  useEffect(() => { if (open) setIsVisible(true); }, [open]);
  useEffect(() => {
    const ids = ["about", "flight-booking-wizard", "umrah", "domestic", "foreigner", "foreign-travel", "gallery", "testimonials", "faq", "footer"];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActiveSection(`#${visible.target.id}`);
    }, { rootMargin: "-25% 0px -60% 0px", threshold: [0.1, 0.4, 0.7] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!accountOpen) return;
    const close = () => setAccountOpen(false);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", onKey); };
  }, [accountOpen]);

  const links = [
    { href: "#about", label: t("about") },
    { href: "#flight-booking-wizard", label: t("ticket") },
    { href: "#umrah", label: t("umrah") },
    { href: "#domestic", label: t("domestic") },
    { href: "#foreigner", label: t("foreigner") },
    { href: "#foreign-travel", label: t("foreignTravel") },
    { href: "#visa", label: t("visa") },
    { href: "#faq", label: t("faq") },
  ];

  return (
    <header className={`sticky top-0 z-40 w-full border-b border-togt-blue/10 backdrop-blur transition-all duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"} ${scrolled ? "bg-white/95 shadow-sm" : "bg-white/80"}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-togt-navy transition-transform duration-300 hover:scale-105">
          <Image
            src="/images/logo/TOGT_Tour_Travel_Final_Logo_For_Print.jpg"
            alt="TOGT Tour and Travel Logo"
            width={180}
            height={50}
            priority
            className="h-12 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`group relative text-sm font-medium transition-colors ${activeSection === l.href ? "text-togt-blue" : "text-togt-navy/80 hover:text-togt-blue"}`}
            >
              {l.label}<span className={`absolute -bottom-2 left-0 h-0.5 bg-togt-orange transition-all duration-300 ${activeSection === l.href ? "w-full" : "w-0 group-hover:w-full"}`} />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <div className="relative">
               <button onClick={(event) => { event.stopPropagation(); setAccountOpen((value) => !value); }} aria-haspopup="menu" aria-expanded={accountOpen} className="flex items-center gap-2 rounded-full border border-togt-blue/15 px-3 py-1.5 text-sm font-semibold text-togt-navy">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-togt-blue text-xs text-white">{user?.fullName.slice(0, 2).toUpperCase()}</span>
                <span className="max-w-28 truncate">{user?.fullName}</span>
              </button>
              {accountOpen && (
                 <div onClick={(event) => event.stopPropagation()} role="menu" className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl">
                  <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm text-togt-navy hover:bg-slate-50">Dashboard</Link>
                  <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm text-togt-navy hover:bg-slate-50">Settings</Link>
                  <button onClick={() => void logout()} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="rounded-lg border border-togt-blue px-3 py-2 text-sm font-semibold text-togt-blue hover:bg-togt-blue hover:text-white">Sign In</Link>
          )}
        </div>

        <button
          className="lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-togt-blue/10 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-togt-navy/80"
              >
                {l.label}
              </a>
            ))}
            <div className="flex items-center justify-between pt-2">
              <LanguageSwitcher />
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="text-sm font-semibold text-togt-blue">Dashboard</Link>
                  <button onClick={() => { setOpen(false); void logout(); }} className="text-sm font-semibold text-red-600">Logout</button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg border border-togt-blue px-3 py-2 text-sm font-semibold text-togt-blue">Sign In</Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
