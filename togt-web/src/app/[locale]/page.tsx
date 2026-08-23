import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { About } from "@/components/site/about";
import { FlightBookingSection } from "@/components/site/flight-booking-section";
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

export default function HomePage() {
  return (
    <SmartFormProvider>
      <Navbar />
      <main>
        <Hero />
        <About />
        <FlightBookingSection />
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
