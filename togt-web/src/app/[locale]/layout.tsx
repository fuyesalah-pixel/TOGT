import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import { NativeAppGate } from "@/components/native/native-app-gate";
import { MaintenanceGate } from "@/components/system/maintenance-gate";
import { SITE_URL, localizedAlternates } from "@/lib/seo";
import "../globals.css";

import { Playfair_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700", "800", "900"],
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> | { locale: string } }): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "TOGT Tour & Travel — Best Umrah & Travel Agency in Addis Ababa, Ethiopia",
      template: "%s | TOGT Tour & Travel",
    },
    description:
      "TOGT Tour & Travel is the best Umrah travel agency in Ethiopia — IATA-accredited, based in Addis Ababa. Book the best 3, 5 & 10-day Umrah packages, cheap flight tickets, domestic tours, foreigner tours and visa processing with Ethiopia's most trusted travel company.",
    keywords: [
      // Brand — people searching just "TOGT".
      "TOGT",
      "TOGT travel",
      "TOGT tour and travel",
      "TOGT Tour & Travel",
      "TOGT Ethiopia",
      "TOGT Addis Ababa",
      "TOGT umrah",
      "TOGT flights",
      "TOGT visa",
      "togttrading",
      "togttrading.com",
      // Brand + every service.
      "TOGT umrah packages",
      "TOGT flight booking",
      "TOGT tour packages",
      "TOGT visa service",
      "TOGT domestic tours",
      "TOGT tourist packages",
      "TOGT contact",
      // Core services + Ethiopia.
      "umrah",
      "umrah Ethiopia",
      "umrah from Ethiopia",
      "best umrah travel",
      "best umrah travel agency in Ethiopia",
      "best 3 travel in Ethiopia",
      "best 5 travel in Ethiopia",
      "best 10 travel in Ethiopia",
      "Umrah packages from Addis Ababa",
      "Umrah visa Ethiopia",
      "hajj packages Ethiopia",
      "cheap flights from Addis Ababa",
      "flight ticket Ethiopia",
      "flight booking Ethiopia",
      "travel agency Ethiopia",
      "travel agency in Ethiopia",
      "best travel agency in Ethiopia",
      "top travel agency in Ethiopia",
      "best travel agency in Addis Ababa",
      "top travel and tours Ethiopia",
      "tour operator Ethiopia",
      "tour and travel company in Ethiopia",
      "travel agency near me Addis Ababa",
      "IATA accredited travel agency Ethiopia",
      "visa processing Addis Ababa",
      "visa service Ethiopia",
      "domestic tours Ethiopia",
      "tourist packages Ethiopia",
      "Ethiopia tour packages",
      "Lalibela tour Ethiopia",
      "Bale Mountains tour",
      "Danakil Depression tour",
      "Addis Ababa city tour",
      "foreign travel from Ethiopia",
      "Dubai tour package from Ethiopia",
      "travel agency Jemo Addis Ababa",
    ],
    alternates: localizedAlternates("", locale),
    icons: { icon: "/favicon.jpg?v=2", apple: "/apple-touch-icon.jpg?v=2" },
    openGraph: {
      type: "website",
      siteName: "TOGT Tour & Travel",
      locale,
      title: "TOGT Tour & Travel — Best Umrah & Travel Agency in Ethiopia",
      description: "IATA-accredited Umrah, flight, tour and visa specialists in Addis Ababa. Best 3, 5 & 10-day Umrah packages from Ethiopia.",
    },
    twitter: { card: "summary_large_image" },
    other: {
      // Geo signals for local search (Jemo 1, Addis Ababa office).
      "geo.region": "ET-AA",
      "geo.placename": "Addis Ababa, Ethiopia",
      "geo.position": "8.9845;38.7036",
      ICBM: "8.9845, 38.7036",
    },
    robots: {
      index: locale !== "om",
      follow: true,
      googleBot: { index: locale !== "om", follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <NextIntlClientProvider>
          <Providers><MaintenanceGate><NativeAppGate>{children}</NativeAppGate></MaintenanceGate></Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
