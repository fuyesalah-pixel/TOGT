"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#about", label: t("about") },
    { href: "#umrah", label: t("umrah") },
    { href: "#domestic", label: t("domestic") },
    { href: "#foreigner", label: t("foreigner") },
    { href: "#ticket", label: t("ticket") },
    { href: "#visa", label: t("visa") },
    { href: "#faq", label: t("faq") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-togt-blue/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-togt-navy transition-transform duration-300 hover:scale-105">
          <Image
            src="/images/logo/TOGT_Tour_Travel_Final Logo Png.png"
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
              className="text-sm font-medium text-togt-navy/80 transition-colors hover:text-togt-blue"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <Button
            className="bg-togt-orange text-white hover:bg-togt-orange/90"
            render={<a href="#smart-form">{t("smartForm")}</a>}
          />
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
              <Button
                className="bg-togt-orange text-white hover:bg-togt-orange/90"
                render={<a href="#smart-form">{t("smartForm")}</a>}
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
