"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bell, Check, Download, Hand, MapPin, Plane, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * "Download our app" section.
 *
 * The phone is a FIXED-height device frame; each slide renders inside an
 * absolutely-positioned screen area, so content changes never resize the
 * phone (the old version reflowed with every slide, pushing the page up
 * and down while sliding).
 */
export function DownloadAppSection() {
  const t = useTranslations("DownloadApp");
  const features = [t("featureBook"), t("featureTrack"), t("featureChat"), t("featureGps"), t("featureQibla"), t("featureNotifications")];
  const [slide, setSlide] = useState(0);
  const guide = [
    { title: t("guideHome"), detail: t("guideHomeDetail"), kind: "home" as const },
    { title: t("guidePackage"), detail: t("guidePackageDetail"), kind: "package" as const },
    { title: t("guideForm"), detail: t("guideFormDetail"), kind: "form" as const },
    { title: t("guideSuccess"), detail: t("guideSuccessDetail"), kind: "success" as const },
  ];
  useEffect(() => { const timer = window.setInterval(() => setSlide((current) => (current + 1) % guide.length), 3200); return () => window.clearInterval(timer); }, [guide.length]);
  const currentGuide = guide[slide];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#12394F] to-[#1F67B1] px-4 py-16 text-white md:py-24">
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#FF9300]/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex justify-center">
          <PhoneMockup currentGuide={currentGuide} slide={slide} onSlide={setSlide} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
           <p className="text-xs font-bold uppercase tracking-[0.25em] text-togt-orange">{t("eyebrow")}</p>
           <h2 className="mt-3 text-3xl font-extrabold md:text-5xl">{t("title")}</h2>
           <p className="mt-4 max-w-xl text-white/75">{t("description")}</p>
           <ul className="mt-7 grid gap-3 sm:grid-cols-2">{features.map((feature, index) => <motion.li key={feature} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} className="flex items-center gap-2 text-sm text-white/85"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-togt-orange/20 text-togt-orange"><Check className="h-4 w-4" /></span>{feature}</motion.li>)}</ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="/downloads/TOGT-Android.apk" download className="inline-flex items-center justify-center gap-3 rounded-xl bg-togt-orange px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105 hover:bg-orange-600"><Download className="h-5 w-5" /><span><small className="block text-left text-xs text-white/75">{t("downloadFor")}</small>{t("android")}</span></a><a href="https://apps.apple.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 font-bold text-togt-navy shadow-lg transition hover:scale-105"><span className="text-xl">🍎</span><span><small className="block text-left text-xs text-gray-500">{t("comingSoon")}</small>{t("appStore")}</span></a></div>
           <p className="mt-4 text-xs text-white/45">{t("version")}</p>
        </motion.div>
      </div>
    </section>
  );
}

function PhoneMockup({ currentGuide, slide, onSlide }: { currentGuide: { title: string; detail: string; kind: string }; slide: number; onSlide: (index: number) => void }) {
  const slides = 4;
  return (
    <div className="relative">
      {/* Glow halo behind the phone */}
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 -z-10 h-[115%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-[3.5rem] bg-gradient-to-br from-[#FF9300]/30 via-white/10 to-transparent blur-2xl" />

      {/* ── Device frame: fixed size, titanium body, realistic details ── */}
      <div className="relative -rotate-6">
        {/* Side buttons */}
        <span aria-hidden="true" className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-slate-700" />
        <span aria-hidden="true" className="absolute -left-[3px] top-36 h-14 w-[3px] rounded-l bg-slate-700" />
        <span aria-hidden="true" className="absolute -left-[3px] top-[12.5rem] h-14 w-[3px] rounded-l bg-slate-700" />
        <span aria-hidden="true" className="absolute -right-[3px] top-32 h-16 w-[3px] rounded-r bg-slate-700" />

        {/* Frame + screen */}
        <div className="relative h-[540px] w-[264px] rounded-[3rem] border-[10px] border-slate-900 bg-slate-900 shadow-[0_35px_70px_-15px_rgba(0,0,0,0.6),0_0_0_2px_rgba(148,163,184,0.25)_inset]">
          {/* Screen — absolutely positioned content so slide changes NEVER resize the frame */}
          <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-gradient-to-b from-[#eef4fb] via-white to-[#fff4ea]">
            {/* Status bar */}
            <div className="absolute inset-x-0 top-0 z-20 flex h-9 items-center justify-between px-6 text-[10px] font-bold text-slate-800">
              <span>9:41</span>
              {/* Dynamic island */}
              <span className="absolute left-1/2 top-1.5 h-6 w-24 -translate-x-1/2 rounded-full bg-slate-950" />
              <span className="flex items-center gap-1 text-slate-900">
                <span className="inline-block h-2 w-3 rounded-[2px] bg-slate-900" />
                <span className="inline-block h-2.5 w-5 rounded-[3px] border border-slate-900"><span className="block h-full w-4/5 rounded-l-[2px] bg-slate-900" /></span>
              </span>
            </div>

            {/* App header */}
            <div className="absolute inset-x-0 top-9 z-10 flex items-center justify-between bg-gradient-to-r from-[#12394F] to-[#1F67B1] px-4 pb-3 pt-2 text-white">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                  <Plane className="h-4 w-4 text-[#FF9300]" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold leading-none">TOGT</p>
                  <p className="text-[7px] uppercase tracking-[0.2em] text-white/60">Tour &amp; Travel</p>
                </div>
              </div>
              <Bell className="h-4 w-4 text-white/80" />
            </div>

            {/* Slides — absolutely stacked, crossfade between them */}
            <div className="absolute inset-x-0 bottom-0 top-[76px]">
              {(["home", "package", "form", "success"] as const).map((kind, index) => (
                <div
                  key={kind}
                  className={`absolute inset-0 p-4 transition-all duration-500 ${index === slide ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
                  aria-hidden={index !== slide}
                >
                  {kind === "home" && <HomeSlide title={currentGuide.title} detail={currentGuide.detail} />}
                  {kind === "package" && <PackageSlide title={currentGuide.title} detail={currentGuide.detail} />}
                  {kind === "form" && <FormSlide title={currentGuide.title} detail={currentGuide.detail} />}
                  {kind === "success" && <SuccessSlide title={currentGuide.title} detail={currentGuide.detail} />}
                </div>
              ))}
            </div>

            {/* Page dots */}
            <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-1.5">
              {Array.from({ length: slides }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Show guide slide ${index + 1}`}
                  onClick={() => onSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${index === slide ? "w-6 bg-[#FF9300]" : "w-1.5 bg-slate-400/60"}`}
                />
              ))}
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-1.5 left-1/2 z-20 h-1 w-20 -translate-x-1/2 rounded-full bg-slate-900/70" />
          </div>
        </div>

        {/* Floating hand pointer */}
        <motion.div aria-hidden="true" animate={{ x: [0, 26, 26, 0], y: [0, 16, 16, 0], scale: [1, 0.88, 1, 1] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-24 right-3 z-30 text-togt-orange drop-shadow-lg">
          <Hand className="h-8 w-8 rotate-[-20deg] fill-togt-orange/30" />
        </motion.div>

        {/* Floating badge */}
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -bottom-4 right-2 z-30 flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-extrabold text-togt-navy shadow-xl">
          <Smartphone className="h-3.5 w-3.5 text-togt-orange" /> Travel smarter
        </motion.div>
      </div>
    </div>
  );
}

/* ── Screen slides — every slide renders the same amount of fixed-height rows ── */

function SlideHeader({ title, detail, tint }: { title: string; detail: string; tint: string }) {
  return (
    <div className={`${tint} h-[88px] rounded-2xl p-3.5 text-white shadow-md`}>
      <p className="text-base font-extrabold leading-tight">{title}</p>
      <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-white/85">{detail}</p>
    </div>
  );
}

function HomeSlide({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <SlideHeader title={title} detail={detail} tint="bg-gradient-to-br from-[#12394F] to-[#1F67B1]" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { label: "Umrah", icon: <span className="text-sm">🕋</span> },
          { label: "Flights", icon: <Plane className="h-4 w-4" /> },
          { label: "Visa", icon: <span className="text-sm">🛂</span> },
          { label: "Tours", icon: <MapPin className="h-4 w-4" /> },
        ].map((item) => (
          <div key={item.label} className="flex h-[72px] flex-col items-center justify-center gap-1 rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <span className="text-[#1F67B1]">{item.icon}</span>
            <span className="text-[10px] font-bold text-slate-700">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-24 rounded-xl bg-gradient-to-r from-[#FF9300]/90 to-[#ffb25e] p-3 text-white shadow-md">
        <p className="text-[11px] font-extrabold">IATA Accredited</p>
        <p className="mt-0.5 text-[9px] text-white/85">Direct airline access — no middlemen</p>
        <div className="mt-2 h-8 rounded-lg bg-white/25" />
      </div>
    </div>
  );
}

function PackageSlide({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <SlideHeader title={title} detail={detail} tint="bg-gradient-to-br from-[#1F67B1] to-[#3d8bd6]" />
      {[
        { name: "Umrah Economy", nights: "10 nights", price: "from 145,000 ETB" },
        { name: "Umrah VIP", nights: "5 nights", price: "from 265,000 ETB" },
      ].map((pkg) => (
        <div key={pkg.name} className="mt-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-extrabold text-slate-800">{pkg.name}</p>
            <span className="rounded-full bg-[#FF9300]/15 px-2 py-0.5 text-[8px] font-bold text-[#e07f00]">{pkg.nights}</span>
          </div>
          <p className="mt-1 text-[9px] font-semibold text-[#1F67B1]">{pkg.price}</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100"><div className="h-1.5 w-2/3 rounded-full bg-[#FF9300]" /></div>
        </div>
      ))}
      <div className="mt-3 h-16 rounded-xl bg-slate-100 p-3"><div className="h-2 w-24 rounded bg-slate-300" /><div className="mt-2 h-2 w-32 rounded bg-slate-200" /></div>
    </div>
  );
}

function FormSlide({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <SlideHeader title={title} detail={detail} tint="bg-gradient-to-br from-[#FF9300] to-[#ffb25e]" />
      <div className="mt-3 space-y-2">
        {["Full name", "Passport number", "Travel date"].map((label) => (
          <div key={label}>
            <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <div className="h-8 rounded-lg bg-white shadow-sm ring-1 ring-slate-100" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-10 items-center justify-center rounded-xl bg-[#1F67B1] text-[10px] font-extrabold text-white shadow-md">Continue →</div>
    </div>
  );
}

function SuccessSlide({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <SlideHeader title={title} detail={detail} tint="bg-gradient-to-br from-emerald-600 to-emerald-400" />
      <div className="mt-4 flex flex-col items-center rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 14 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-7 w-7 text-emerald-600" />
        </motion.div>
        <p className="mt-3 text-[11px] font-extrabold text-slate-800">Request confirmed!</p>
        <p className="mt-0.5 text-center text-[9px] text-slate-500">We will contact you shortly.</p>
      </div>
      <div className="mt-3 h-14 rounded-xl bg-slate-100 p-3"><div className="h-2 w-28 rounded bg-slate-300" /><div className="mt-2 h-2 w-20 rounded bg-slate-200" /></div>
    </div>
  );
}
