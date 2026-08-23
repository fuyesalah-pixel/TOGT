"use client";

import { motion } from "framer-motion";
import { Check, Download, Smartphone } from "lucide-react";

const features = ["Book packages from your phone", "Track service requests in real time", "Chat with TOGT support", "GPS parent tracking for Umrah", "Qibla locator and Azan alarm", "Instant multilingual notifications"];

export function DownloadAppSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#12394F] to-[#1F67B1] px-4 py-16 text-white md:py-24">
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#FF9300]/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex justify-center">
          <div className="relative w-56 rotate-[-6deg] rounded-[2.5rem] border-8 border-slate-900 bg-white p-2 shadow-2xl shadow-black/30">
            <div className="overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-blue-50 to-orange-50">
              <div className="flex h-8 items-center justify-center"><span className="h-1.5 w-16 rounded-full bg-slate-300" /></div>
              <div className="p-4">
                <div className="rounded-xl bg-togt-navy p-4 text-white"><Smartphone className="h-7 w-7 text-togt-orange" /><p className="mt-8 text-lg font-extrabold">TOGT</p><p className="text-xs text-white/60">Your journey, managed.</p></div>
                <div className="mt-3 space-y-2"><div className="h-3 w-4/5 rounded bg-blue-100" /><div className="h-3 w-3/5 rounded bg-orange-100" /><div className="h-20 rounded-xl bg-slate-100" /></div>
              </div>
            </div>
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
