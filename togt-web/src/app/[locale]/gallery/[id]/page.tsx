import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, breadcrumbSchema, fetchPublic, pageMetadata, type SeoLocale } from "@/lib/seo";

type GalleryItem = { id: string; title: string; category: string; location?: string | null; description: string; image: string; images: string[]; createdAt: string };
async function getItem(id: string, locale: string) { return fetchPublic<GalleryItem>(`/content/gallery/${encodeURIComponent(id)}`, locale); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params; const item = await getItem(id, locale);
  if (!item) return { title: "Gallery item not found | TOGT", robots: { index: false, follow: false } };
  return pageMetadata(locale as SeoLocale, `gallery/${id}`, `${item.title} — TOGT Tour & Travel`, `${item.description}${item.location ? ` Explore ${item.location} with TOGT Tour & Travel.` : " TOGT Tour & Travel, Addis Ababa."}`, absoluteUrl(item.image));
}

export default async function GalleryDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params; const item = await getItem(id, locale); if (!item) notFound();
  return <main className="mx-auto max-w-5xl px-4 py-12"><JsonLd data={{ "@context": "https://schema.org", "@type": "ImageObject", name: item.title, description: item.description, contentUrl: absoluteUrl(item.image), creator: { "@type": "Organization", name: "TOGT Tour & Travel" } }} /><JsonLd data={breadcrumbSchema([{ name: "Home", path: `/${locale}` }, { name: "Gallery", path: `/${locale}/gallery` }, { name: item.title, path: `/${locale}/gallery/${id}` }])} /><p className="text-sm font-bold uppercase tracking-widest text-togt-orange">{item.category}{item.location ? ` · ${item.location}` : ""}</p><h1 className="mt-3 text-4xl font-black text-togt-navy">{item.title}</h1><img src={item.image} alt={`${item.title}${item.location ? ` in ${item.location}` : ""} — TOGT Tour & Travel`} className="mt-8 max-h-[38rem] w-full rounded-3xl object-cover" /><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{item.description}</p></main>;
}
