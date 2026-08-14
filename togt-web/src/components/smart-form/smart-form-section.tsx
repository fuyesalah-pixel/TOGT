"use client";

import { useTranslations } from "next-intl";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useSmartForm, type SmartFormTab } from "./smart-form-context";
import { TicketFormTab } from "./tabs/ticket-form-tab";
import { UmrahFormTab } from "./tabs/umrah-form-tab";
import { DomesticFormTab } from "./tabs/domestic-form-tab";
import { TouristFormTab } from "./tabs/tourist-form-tab";
import { VisaFormTab } from "./tabs/visa-form-tab";
import { ContactFormTab } from "./tabs/contact-form-tab";
import { Plane, Mosque, Mountain, Globe, BadgeCheck, MessageSquare } from "lucide-react";

/* ── Tab definitions ──────────────────────────────────────────────────── */
const TAB_CONFIG: { value: SmartFormTab; icon: React.ReactNode; labelKey: string }[] = [
  { value: "ticket",   icon: <Plane        className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.ticket"   },
  { value: "umrah",    icon: <Mosque       className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.umrah"    },
  { value: "domestic", icon: <Mountain     className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.domestic" },
  { value: "tourist",  icon: <Globe        className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.tourist"  },
  { value: "visa",     icon: <BadgeCheck   className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.visa"     },
  { value: "contact",  icon: <MessageSquare className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.contact" },
];

export function SmartFormSection() {
  const t = useTranslations("SmartForm");
  const { activeTab, openTab } = useSmartForm();

  return (
    <section id="smart-form" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* ── Section header ─────────────────────────────────────── */}
        <div className="text-center mb-10 md:mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-[2px] w-8 rounded-full bg-[#FF9300]" />
            <span className="text-[#FF9300] font-bold tracking-[0.2em] text-xs uppercase">
              Get Started
            </span>
            <div className="h-[2px] w-8 rounded-full bg-[#FF9300]" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#12394F]">
            {t("title")}
          </h2>
          <p className="mt-3 text-sm md:text-base text-gray-500 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* ── Gradient border card ────────────────────────────────── */}
        <div
          className="sf-form-enter rounded-2xl md:rounded-3xl p-[2px] shadow-xl md:shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #1F67B1 0%, #FF9300 50%, #1F67B1 100%)",
          }}
        >
          <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden">

            <Tabs
              value={activeTab}
              onValueChange={(value) => openTab(value as SmartFormTab)}
              className="w-full flex flex-col"
            >
              {/* ── Sticky tab strip ─────────────────────────────── */}
              <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
                <div
                  className="flex gap-1.5 px-3 sm:px-5 py-3 scrollbar-hide"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {TAB_CONFIG.map(({ value, icon, labelKey }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => openTab(value)}
                      className={[
                        "flex-shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5",
                        "rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap",
                        "outline-none transition-all duration-200 min-h-[38px]",
                        activeTab === value
                          ? "bg-[#12394F] text-white shadow-md"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                      ].join(" ")}
                    >
                      {icon}
                      <span>{t(labelKey as Parameters<typeof t>[0])}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Form content area ────────────────────────────── */}
              <div className="flex-1 p-4 sm:p-6 md:p-8">
                <TabsContent value="ticket" className="sf-tab-content mt-0 data-[state=inactive]:hidden"><TicketFormTab /></TabsContent>
                <TabsContent value="umrah"  className="sf-tab-content mt-0 data-[state=inactive]:hidden"><UmrahFormTab /></TabsContent>
                <TabsContent value="domestic" className="sf-tab-content mt-0 data-[state=inactive]:hidden"><DomesticFormTab /></TabsContent>
                <TabsContent value="tourist"  className="sf-tab-content mt-0 data-[state=inactive]:hidden"><TouristFormTab /></TabsContent>
                <TabsContent value="visa"     className="sf-tab-content mt-0 data-[state=inactive]:hidden"><VisaFormTab /></TabsContent>
                <TabsContent value="contact"  className="sf-tab-content mt-0 data-[state=inactive]:hidden"><ContactFormTab /></TabsContent>
              </div>
            </Tabs>

          </div>
        </div>

      </div>
    </section>
  );
}
