"use client";

import { useTranslations } from "next-intl";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSmartForm } from "@/components/smart-form/smart-form-context";

export function TicketSection() {
  const t = useTranslations("Ticket");
  const { openTab } = useSmartForm();

  return (
    <section id="ticket" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 rounded-2xl bg-togt-navy p-10 text-white lg:grid-cols-[auto_1fr] lg:items-center">
        <Plane className="h-16 w-16 text-togt-orange" />
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">{t("title")}</h2>
          <p className="mt-3 max-w-2xl text-white/80">{t("body")}</p>
          <Button
            className="mt-6 bg-togt-orange text-white hover:bg-togt-orange/90"
            onClick={() => openTab("ticket")}
          >
            {t("cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
