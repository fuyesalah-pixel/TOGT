import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://travel.togttrading.com").replace(/\/$/, "");
export const LOCALES = ["en", "ar", "am", "om"] as const;
export type SeoLocale = (typeof LOCALES)[number];

export function absoluteUrl(path = "") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localizedPath(locale: string, path = "") {
  return `/${locale}${path ? `/${path.replace(/^\//, "")}` : ""}`;
}

export function localizedAlternates(path = "", currentLocale = "en") {
  return {
    canonical: absoluteUrl(localizedPath(currentLocale, path)),
    languages: Object.fromEntries([
      ...LOCALES.map((locale) => [locale, absoluteUrl(localizedPath(locale, path))]),
      ["x-default", absoluteUrl(localizedPath("en", path))],
    ]),
  };
}

export function pageMetadata(locale: SeoLocale, path: string, title: string, description: string, image?: string): Metadata {
  const url = absoluteUrl(localizedPath(locale, path));
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: localizedAlternates(path, locale),
    openGraph: { type: "website", url, title, description, siteName: "TOGT Tour & Travel", locale, images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["TravelAgency", "LocalBusiness", "Organization"],
  "@id": `${SITE_URL}/#organization`,
  name: "TOGT Tour & Travel",
  alternateName: ["TOGT", "TOGT Travel Ethiopia", "TOGT Tour and Travel Addis Ababa"],
  description: "TOGT Tour & Travel — the best travel agency in Ethiopia. IATA-accredited Umrah packages from Addis Ababa, cheap flight tickets, domestic tours (Lalibela, Bale Mountains, Danakil), tourist packages, foreign travel, visa processing and visa services across Ethiopia.",
  url: SITE_URL,
  image: absoluteUrl("/images/logo/TOGT_Tour_Travel_Final_Logo_For_Print.jpg"),
  logo: absoluteUrl("/images/logo/TOGT_Tour_Travel_Final_Logo_For_Print.jpg"),
  telephone: "+251997979741",
  email: "info@togttrading.com",
  priceRange: "$$",
  address: { "@type": "PostalAddress", streetAddress: "Jemo 1, Front of AK Building, 3rd Floor", addressLocality: "Addis Ababa", addressRegion: "Addis Ababa", addressCountry: "ET" },
  geo: { "@type": "GeoCoordinates", latitude: 8.9845, longitude: 38.7036 },
  hasMap: "https://maps.app.goo.gl/1QFBkEZMVwwjG6Aj9",
  openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "08:00", closes: "19:00" }],
  contactPoint: [{ "@type": "ContactPoint", telephone: "+251997979741", email: "info@togttrading.com", contactType: "customer service", areaServed: "ET", availableLanguage: ["English", "Amharic", "Afaan Oromo", "Arabic"] }],
  areaServed: [
    { "@type": "Country", name: "Ethiopia" },
    { "@type": "City", name: "Addis Ababa" },
  ],
  sameAs: ["https://facebook.com/togt", "https://www.instagram.com/togt_tourandtravel", "https://t.me/Togttourandtravel", "https://youtube.com/@togt", "https://www.tiktok.com/@islamic.dawa.official11"],
};

/** LocalBusiness-flavored service list — captures "[service] + Ethiopia" queries. */
export const servicesSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "TOGT Tour & Travel services in Ethiopia",
  itemListElement: [
    "Umrah packages from Ethiopia",
    "Flight booking in Addis Ababa",
    "Domestic tours in Ethiopia",
    "Tourist packages in Ethiopia",
    "Foreign travel packages from Ethiopia",
    "Visa processing in Ethiopia",
  ].map((name, index) => ({ "@type": "ListItem", position: index + 1, item: { "@type": "Service", name, provider: { "@id": `${SITE_URL}/#organization` }, areaServed: { "@type": "Country", name: "Ethiopia" } } })),
};

/** Umrah-focused service schema — reinforces "best umrah travel" queries. */
export const umrahServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Umrah Packages",
  name: "Best Umrah Travel Packages from Ethiopia",
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: { "@type": "Country", name: "Ethiopia" },
  audience: { "@type": "PeopleAudience", audienceType: "Muslim pilgrims traveling from Ethiopia" },
  offers: [3, 5, 10, 14, 21].map((days) => ({
    "@type": "Offer",
    name: `Best ${days}-day Umrah package from Ethiopia`,
    priceCurrency: "ETB",
    availability: "https://schema.org/InStock",
    url: absoluteUrl("/en/packages"),
  })),
};

export type FaqSchemaItem = { question: string; answer: string };

/** FAQPage schema — eligible for rich results / People Also Ask. */
export function faqSchema(items: FaqSchemaItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
};

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })) };
}

export function jsonLd(value: unknown) {
  return { __html: JSON.stringify(value).replace(/</g, "\\u003c") };
}

export async function fetchPublic<T>(path: string, locale?: string): Promise<T | null> {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
  try {
    const response = await fetch(`${apiUrl}/api${path}${locale ? `${path.includes("?") ? "&" : "?"}locale=${encodeURIComponent(locale)}` : ""}`, { next: { revalidate: 300, tags: ["seo-content"] } });
    if (!response.ok) return null;
    return response.json() as Promise<T>;
  } catch {
    return null;
  }
}
