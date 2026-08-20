import { ChevronRight, Home } from "lucide-react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

export function ResourcePage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <><Navbar /><main className="min-h-screen bg-slate-50"><header className="bg-gradient-to-br from-togt-navy to-togt-blue px-4 py-16 text-white"><div className="mx-auto max-w-5xl"><div className="flex items-center gap-2 text-sm text-white/70"><Home className="h-4 w-4" />Home<ChevronRight className="h-4 w-4" />{title}</div><h1 className="mt-6 text-4xl font-extrabold md:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-lg text-white/75">{subtitle}</p></div></header><div className="mx-auto max-w-5xl px-4 py-10">{children}</div></main><Footer /></>;
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="mb-3 text-2xl font-bold text-togt-navy">{title}</h2><div className="prose prose-slate max-w-none text-gray-600">{children}</div></section>; }
