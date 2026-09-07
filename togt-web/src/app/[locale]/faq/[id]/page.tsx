import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, fetchPublic, pageMetadata, type SeoLocale } from "@/lib/seo";

type FaqItem = { id: string; question: string; answer: string; category: string; createdAt: string };
async function getItem(id: string, locale: string) { return fetchPublic<FaqItem>(`/content/faq/${encodeURIComponent(id)}`, locale); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params; const item = await getItem(id, locale);
  if (!item) return { title: "FAQ not found | TOGT", robots: { index: false, follow: false } };
  return pageMetadata(locale as SeoLocale, `faq/${id}`, `${item.question} | TOGT Tour & Travel`, item.answer);
}

export default async function FaqDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params; const item = await getItem(id, locale); if (!item) notFound();
  return <main className="mx-auto max-w-3xl px-4 py-16"><JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } }] }} /><JsonLd data={breadcrumbSchema([{ name: "Home", path: `/${locale}` }, { name: "FAQ", path: `/${locale}/faq` }, { name: item.question, path: `/${locale}/faq/${id}` }])} /><p className="text-sm font-bold uppercase tracking-widest text-togt-orange">{item.category}</p><h1 className="mt-3 text-4xl font-black text-togt-navy">{item.question}</h1><p className="mt-8 text-lg leading-8 text-slate-700">{item.answer}</p></main>;
}
