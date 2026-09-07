import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, breadcrumbSchema, fetchPublic, pageMetadata, type SeoLocale } from "@/lib/seo";

type PackageItem = { id: string; title: string; description: string; type: string; image?: string | null; images: string[]; price?: number | null; currency?: string | null; duration?: string | null; destination?: string | null; includes: string[]; excludes: string[]; updatedAt: string };

async function getPackage(id: string, locale: string) { return fetchPublic<PackageItem>(`/packages/${encodeURIComponent(id)}`, locale); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const item = await getPackage(id, locale);
  if (!item) return { title: "Package not found | TOGT Tour & Travel", robots: { index: false, follow: false } };
  const price = item.price != null ? `${item.price.toLocaleString()} ${item.currency ?? "ETB"}` : "Custom pricing";
  return pageMetadata(locale as SeoLocale, `packages/${id}`, `${item.title} — ${price} | TOGT Tour & Travel`, `Book ${item.title} from Ethiopia with TOGT Tour & Travel. ${item.duration ?? "Flexible duration"}${item.destination ? ` in ${item.destination}` : ""}, professional support, and IATA-accredited travel assistance in Addis Ababa.`, item.image ? absoluteUrl(item.image) : undefined);
}

export default async function PackagePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const item = await getPackage(id, locale);
  if (!item) notFound();
  const price = item.price != null ? item.price : undefined;
  const schema = { "@context": "https://schema.org", "@type": "Product", name: item.title, description: item.description, image: (item.images.length ? item.images : item.image ? [item.image] : []).map((image) => absoluteUrl(image)), brand: { "@type": "Brand", name: "TOGT Tour & Travel" }, offers: { "@type": "Offer", price: price ?? undefined, priceCurrency: item.currency ?? "ETB", availability: "https://schema.org/InStock", url: absoluteUrl(`/${locale}/packages/${id}`) } };
  return <main className="mx-auto max-w-5xl px-4 py-12"><JsonLd data={schema} /><JsonLd data={breadcrumbSchema([{ name: "Home", path: `/${locale}` }, { name: "Packages", path: `/${locale}/packages` }, { name: item.title, path: `/${locale}/packages/${id}` }])} /><div className="grid gap-8 md:grid-cols-2"><div>{item.image && <img src={item.image} alt={`${item.title} travel package`} className="w-full rounded-3xl object-cover" />}</div><div><p className="text-sm font-bold uppercase tracking-widest text-togt-orange">{item.type.replaceAll("_", " ")}</p><h1 className="mt-3 text-4xl font-black text-togt-navy">{item.title}</h1><p className="mt-4 text-lg text-slate-600">{item.description}</p><p className="mt-6 text-2xl font-black text-togt-orange">{price != null ? `${price.toLocaleString()} ${item.currency ?? "ETB"}` : "Custom pricing"}</p><p className="mt-2 text-sm text-slate-500">{item.duration ?? "Flexible duration"}{item.destination ? ` · ${item.destination}` : ""}</p><a href={`/${locale}#smart-form`} className="mt-8 inline-flex rounded-full bg-togt-orange px-6 py-3 font-bold text-white">Request this package</a></div></div><div className="mt-12 grid gap-8 md:grid-cols-2"><section><h2 className="text-2xl font-black text-togt-navy">What&apos;s included</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600">{item.includes.map((value) => <li key={value}>{value}</li>)}</ul></section><section><h2 className="text-2xl font-black text-togt-navy">What&apos;s not included</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600">{item.excludes.map((value) => <li key={value}>{value}</li>)}</ul></section></div></main>;
}
