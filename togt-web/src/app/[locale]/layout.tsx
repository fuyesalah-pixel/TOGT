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
  return { metadataBase: new URL(SITE_URL), title: "TOGT Tour & Travel | Addis Ababa, Ethiopia", description: "IATA-accredited travel agency offering flight booking, Umrah packages, domestic and international tours, visa processing, and travel consulting from Addis Ababa, Ethiopia.", alternates: localizedAlternates("", locale), icons: { icon: "/favicon.jpg?v=2", apple: "/apple-touch-icon.jpg?v=2" }, openGraph: { type: "website", siteName: "TOGT Tour & Travel", locale, title: "TOGT Tour & Travel | Addis Ababa, Ethiopia", description: "IATA-accredited travel agency offering flight booking, Umrah packages, tours, visa processing, and travel consulting." }, twitter: { card: "summary_large_image" }, robots: locale === "om" ? { index: false, follow: true } : undefined };
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
