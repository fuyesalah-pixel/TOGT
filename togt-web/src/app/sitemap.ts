import type { MetadataRoute } from "next";
import { absoluteUrl, LOCALES, localizedPath, fetchPublic } from "@/lib/seo";

type PackageItem = { id: string; updatedAt: string; isActive: boolean };
type GalleryItem = { id: string; createdAt: string };
type FaqItem = { id: string; createdAt: string };

const publicPages = ["", "packages", "gallery", "faq", "blog", "umrah-guide", "visa-requirements", "terms", "privacy", "refund-policy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packages, gallery, faqs] = await Promise.all([
    fetchPublic<PackageItem[]>("/packages"),
    fetchPublic<GalleryItem[]>("/content/gallery"),
    fetchPublic<FaqItem[]>("/content/faq"),
  ]);
  const pages = LOCALES.flatMap((locale) => publicPages.map((page) => ({ url: absoluteUrl(localizedPath(locale, page)), lastModified: new Date(), changeFrequency: page === "" ? "daily" as const : "weekly" as const, priority: page === "" ? 1 : 0.7 })));
  const entities = LOCALES.flatMap((locale) => [
    ...(packages ?? []).filter((item) => item.isActive).map((item) => ({ url: absoluteUrl(localizedPath(locale, `packages/${item.id}`)), lastModified: new Date(item.updatedAt), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...(gallery ?? []).map((item) => ({ url: absoluteUrl(localizedPath(locale, `gallery/${item.id}`)), lastModified: new Date(item.createdAt), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...(faqs ?? []).map((item) => ({ url: absoluteUrl(localizedPath(locale, `faq/${item.id}`)), lastModified: new Date(item.createdAt), changeFrequency: "monthly" as const, priority: 0.6 })),
  ]);
  return [...pages, ...entities];
}
