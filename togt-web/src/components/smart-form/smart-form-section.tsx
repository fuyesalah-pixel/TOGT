"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs";
import { useSmartForm, type SmartFormTab } from "./smart-form-context";
import { TicketFormTab } from "./tabs/ticket-form-tab";
import { UmrahFormTab } from "./tabs/umrah-form-tab";
import { DomesticFormTab } from "./tabs/domestic-form-tab";
import { TouristFormTab } from "./tabs/tourist-form-tab";
import { VisaFormTab } from "./tabs/visa-form-tab";
import { ForeignTravelFormTab } from "./tabs/foreign-travel-form-tab";
import { ContactFormTab } from "./tabs/contact-form-tab";
import { Plane, Mosque, Mountain, Globe, BadgeCheck, MessageSquare, PlaneTakeoff } from "lucide-react";
import { CalendarDays, CreditCard } from "lucide-react";

type PaymentOptions = { packageName: string; amount: number; currency: string; onPayNow: () => Promise<void>; onPayLater: () => Promise<void> };

/* ── Tab definitions ──────────────────────────────────────────────────── */
const TAB_CONFIG: { value: SmartFormTab; icon: React.ReactNode; labelKey: string }[] = [
  { value: "ticket",        icon: <Plane         className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.ticket"        },
  { value: "umrah",         icon: <Mosque        className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.umrah"         },
  { value: "domestic",      icon: <Mountain      className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.domestic"      },
  { value: "tourist",       icon: <Globe         className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.tourist"       },
  { value: "visa",          icon: <BadgeCheck    className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.visa"          },
  { value: "foreignTravel", icon: <PlaneTakeoff  className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.foreignTravel" },
  { value: "contact",       icon: <MessageSquare className="h-4 w-4 flex-shrink-0" />, labelKey: "tabs.contact"       },
];

export function SmartFormSection() {
  const t = useTranslations("SmartForm");
  const { activeTab, openTab } = useSmartForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptions | null>(null);
  useEffect(() => {
    const start = () => setIsSubmitting(true);
    const end = () => setIsSubmitting(false);
    window.addEventListener("togt:submit-start", start);
    window.addEventListener("togt:submit-end", end);
    return () => { window.removeEventListener("togt:submit-start", start); window.removeEventListener("togt:submit-end", end); };
  }, []);
  useEffect(() => { const open = (event: Event) => setPaymentOptions((event as CustomEvent<PaymentOptions>).detail); window.addEventListener("togt:payment-options", open); return () => window.removeEventListener("togt:payment-options", open); }, []);

  return (
    <section id="smart-form" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      {isSubmitting && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-togt-navy/45 px-4 backdrop-blur-sm"><div className="rounded-2xl bg-white p-8 text-center shadow-2xl"><div className="mx-auto flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-togt-orange/15"><Plane className="h-8 w-8 -rotate-12 text-togt-orange" /></div><h3 className="mt-4 font-bold text-togt-navy">Submitting your request</h3><p className="mt-1 text-sm text-gray-500">Please wait a moment...</p><p className="mt-2 text-xs font-semibold text-togt-orange">Redirecting to your dashboard</p></div></div>}
      {paymentOptions && <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-togt-navy/45 px-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"><h3 className="text-xl font-bold text-togt-navy">Request Summary</h3><p className="mt-3 text-sm text-gray-500">Package: <b className="text-togt-navy">{paymentOptions.packageName}</b></p><p className="mt-1 text-sm text-gray-500">Price: <b className="text-togt-navy">{paymentOptions.amount.toLocaleString()} {paymentOptions.currency}</b></p><p className="mt-5 text-sm font-semibold text-togt-navy">Choose how to proceed:</p><div className="mt-4 grid gap-3"><button disabled={!paymentOptions.amount} onClick={async () => { const choice = paymentOptions; setPaymentOptions(null); try { await choice.onPayNow(); } catch { /* the request flow reports the server error */ } }} className="flex items-center justify-center gap-2 rounded-xl bg-togt-orange px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><CreditCard className="h-4 w-4" />Pay Now - {paymentOptions.amount.toLocaleString()} {paymentOptions.currency}</button><button onClick={async () => { const choice = paymentOptions; setPaymentOptions(null); try { await choice.onPayLater(); } catch { /* the request flow reports the server error */ } }} className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 font-bold text-togt-navy hover:border-togt-blue"><CalendarDays className="h-4 w-4" />Pay Later</button></div><button onClick={() => setPaymentOptions(null)} className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600">Cancel</button></div></div>}
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
                <TabsContent value="visa"          className="sf-tab-content mt-0 data-[state=inactive]:hidden"><VisaFormTab /></TabsContent>
                <TabsContent value="foreignTravel" className="sf-tab-content mt-0 data-[state=inactive]:hidden"><ForeignTravelFormTab /></TabsContent>
                <TabsContent value="contact"       className="sf-tab-content mt-0 data-[state=inactive]:hidden"><ContactFormTab /></TabsContent>
              </div>
            </Tabs>

          </div>
        </div>

      </div>
    </section>
  );
}
