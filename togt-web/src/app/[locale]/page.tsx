import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { About } from "@/components/site/about";
import { SaudiaFlightBookingWizard } from "@/components/site/saudia-flight-booking-wizard";
import { DownloadAppSection } from "@/components/site/download-app-section";
import { UmrahSection } from "@/components/site/umrah-section";
import { WhyTogt } from "@/components/site/why-togt";
import { IATASection } from "@/components/site/iata-section";
import { TicketSection } from "@/components/site/ticket-section";
import { DomesticSection } from "@/components/site/domestic-section";
import { ForeignerSection } from "@/components/site/foreigner-section";
import { ForeignTravelSection } from "@/components/site/foreign-travel-section";
import { VisaSection } from "@/components/site/visa-section";
import { SmartFormSection } from "@/components/smart-form/smart-form-section";
import { GallerySection } from "@/components/site/gallery-section";
import { FaqSection } from "@/components/site/faq-section";
import { TestimonialsSection } from "@/components/site/testimonials-section";
import { Footer } from "@/components/site/footer";
import { FloatingButtons } from "@/components/site/floating-buttons";
import { SmartFormProvider } from "@/components/smart-form/smart-form-context";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, organizationSchema, umrahServiceSchema, faqSchema } from "@/lib/seo";
import { pageMetadata, type SeoLocale } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(
    locale as SeoLocale,
    "",
    "Best Umrah Travel Agency in Ethiopia | Umrah & Flight Packages — TOGT",
    "TOGT Tour & Travel is the best Umrah travel agency in Ethiopia. Book the best 3, 5 & 10-day Umrah packages, cheap flights from Addis Ababa, domestic tours and visa processing with an IATA-accredited agency.",
    "/images/logo/TOGT_Tour_Travel_Final_Logo_For_Print.jpg",
  );
}

// Keyword-rich Q&A matched to what Ethiopian travelers actually search:
// "umrah", "best umrah travel", "best 3/5/10 travel in Ethiopia".
const homeFaq = [
  {
    question: "Which is the best Umrah travel agency in Ethiopia?",
    answer:
      "TOGT Tour & Travel is an IATA-accredited travel agency in Addis Ababa, Ethiopia, trusted for thousands of Umrah journeys. We handle the full package: Umrah visa, flights from Addis Ababa, hotels near the Haram, transport, and Ethiopian-speaking guides in Makkah and Madinah.",
  },
  {
    question: "What is included in the best 3, 5 and 10-day Umrah packages from Ethiopia?",
    answer:
      "TOGT's 3, 5 and 10-day Umrah packages from Addis Ababa include the Umrah visa, return flights, accommodation in Makkah and Madinah, airport transfers, and guidance for every ritual. VIP and honeymoon options add private transport and premium hotels.",
  },
  {
    question: "How much does Umrah from Ethiopia cost?",
    answer:
      "Umrah package prices from Ethiopia vary by season, hotel distance and flight availability. TOGT publishes transparent package prices on our website and accepts payment in ETB or USD through Chapa (Telebirr, cards and bank transfer). Request a quote to get today's best rate.",
  },
  {
    question: "Do I need a visa for Umrah from Ethiopia?",
    answer:
      "Yes. Ethiopian citizens need an Umrah visa, which TOGT processes end-to-end as part of every package, together with required vaccinations and travel documents.",
  },
  {
    question: "Does TOGT book flights and tours other than Umrah?",
    answer:
      "Yes. As an IATA member we issue tickets to 100+ destinations worldwide, arrange domestic tours across Ethiopia, foreigner tours within Ethiopia, visa processing for Saudi Arabia, UAE, Turkey, China and more, plus full travel consulting.",
  },
];

export default function HomePage() {
  return (
    <SmartFormProvider>
      <Navbar />
      <main>
        <JsonLd data={organizationSchema} />
        <JsonLd data={umrahServiceSchema} />
        <JsonLd data={faqSchema(homeFaq)} />
        <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/en" }])} />
        <Hero />
        <About />
        <SaudiaFlightBookingWizard />
        <DownloadAppSection />
        <UmrahSection />
        <DomesticSection />
        <ForeignerSection />
        <ForeignTravelSection />
        <GallerySection />
        <WhyTogt />
        <IATASection />
        <TicketSection />
        <VisaSection />
        <SmartFormSection />
        <FaqSection />
        <TestimonialsSection />
      </main>
      <Footer />
      <FloatingButtons />
    </SmartFormProvider>
  );
}
