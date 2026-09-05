"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Check, Download, Smartphone, Hand } from "lucide-react";

const features = ["Book packages from your phone", "Track service requests in real time", "Chat with TOGT support", "GPS parent tracking for Umrah", "Qibla locator and Azan alarm", "Instant multilingual notifications"];

export function DownloadAppSection() {
  const [slide, setSlide] = useState(0);
  const guide = [
    { title: "TOGT Home", detail: "Find flights, tours, and Umrah packages.", color: "bg-togt-navy", kind: "home" },
    { title: "Choose a package", detail: "Tap a package card to see the details.", color: "bg-togt-blue", kind: "package" },
    { title: "Fill your form", detail: "Send your travel details securely.", color: "bg-togt-orange", kind: "form" },
    { title: "Request submitted", detail: "Success! TOGT will keep you updated.", color: "bg-emerald-600", kind: "success" },
  ];
  useEffect(() => { const timer = window.setInterval(() => setSlide((current) => (current + 1) % guide.length), 3200); return () => window.clearInterval(timer); }, [guide.length]);
  const currentGuide = guide[slide];
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#12394F] to-[#1F67B1] px-4 py-16 text-white md:py-24">
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#FF9300]/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex justify-center">
          <div className="relative w-56 rotate-[-6deg] rounded-[2.5rem] border-8 border-slate-900 bg-white p-2 shadow-2xl shadow-black/30">
            <div className="absolute left-1/2 top-1 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-slate-950" />
            <div className="overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-blue-50 to-orange-50">
              <div className="flex h-8 items-center justify-center"><span className="h-1.5 w-16 rounded-full bg-slate-300" /></div>
              <div className="p-4">
                <div className={`${currentGuide.color} rounded-xl p-4 text-white transition-colors`}><Smartphone className="h-7 w-7 text-white/90" /><p className="mt-8 text-lg font-extrabold">{currentGuide.title}</p><p className="mt-1 text-[11px] text-white/80">{currentGuide.detail}</p>{currentGuide.kind === "home" && <div className="mt-3 grid grid-cols-2 gap-2"><span className="h-8 rounded-lg bg-white/20" /><span className="h-8 rounded-lg bg-white/20" /></div>}{currentGuide.kind === "package" && <div className="mt-3 h-12 rounded-lg bg-white/25" />}{currentGuide.kind === "form" && <div className="mt-3 space-y-1.5"><span className="block h-5 rounded bg-white/25" /><span className="block h-5 rounded bg-white/25" /></div>}{currentGuide.kind === "success" && <div className="mx-auto mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/25"><Check className="h-5 w-5" /></div>}</div>
                <div className="mt-4 flex gap-1.5">{guide.map((_, index) => <button key={index} type="button" aria-label={`Show guide slide ${index + 1}`} onClick={() => setSlide(index)} className={`h-1.5 flex-1 rounded-full ${index === slide ? "bg-togt-orange" : "bg-slate-200"}`} />)}</div>
                <div className="mt-3 space-y-2"><div className="h-3 w-4/5 rounded bg-blue-100" /><div className="h-3 w-3/5 rounded bg-orange-100" /><div className="h-20 rounded-xl bg-slate-100" /></div>
              </div>
            </div>
            <motion.div aria-hidden="true" animate={{ x: [0, 28, 28, 0], y: [0, 18, 18, 0], scale: [1, 0.88, 1, 1] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-20 right-5 z-30 text-togt-orange drop-shadow-lg"><Hand className="h-8 w-8 rotate-[-20deg] fill-togt-orange/30" /></motion.div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -bottom-5 right-4 rounded-xl bg-togt-orange px-3 py-2 text-xs font-bold shadow-lg">Travel smarter</motion.div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-togt-orange">Mobile App</p>
          <h2 className="mt-3 text-3xl font-extrabold md:text-5xl">Download Our <span className="text-togt-orange">App</span></h2>
          <p className="mt-4 max-w-xl text-white/75">Take TOGT everywhere. Book packages, track requests, chat with support, and stay connected during your journey.</p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">{features.map((feature, index) => <motion.li key={feature} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} className="flex items-center gap-2 text-sm text-white/85"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-togt-orange/20 text-togt-orange"><Check className="h-4 w-4" /></span>{feature}</motion.li>)}</ul>
           <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="/downloads/TOGT-Android.apk" download className="inline-flex items-center justify-center gap-3 rounded-xl bg-togt-orange px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105 hover:bg-orange-600"><Download className="h-5 w-5" /><span><small className="block text-left text-xs text-white/75">Download for</small>Android APK</span></a><a href="https://apps.apple.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 font-bold text-togt-navy shadow-lg transition hover:scale-105"><span className="text-xl">🍎</span><span><small className="block text-left text-xs text-gray-500">Coming soon on</small>App Store</span></a></div>
          <p className="mt-4 text-xs text-white/45">Version 1.0.0 · Android 8+ · iOS 13+</p>
        </motion.div>
      </div>
    </section>
  );
}
