import type { Metadata } from "next";
import { ResourcePage, Section } from "@/components/site/resource-page";

export const metadata: Metadata = {
  title: "Terms of Service | TOGT Tour & Travel",
  description:
    "The terms governing use of the Togt Travel mobile app and travel.togttrading.com, and the travel, ticketing, visa, Umrah and tour services provided by TOGT.",
};

const LAST_UPDATED = "26 November 2026";

export default function TermsPage() {
  return (
    <ResourcePage
      title="Terms of Service"
      subtitle="The terms that govern your use of the Togt Travel app, our website and our travel services."
    >
      <p className="mb-8 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

      <Section title="1. Acceptance of These Terms">
        <p>
          These Terms of Service (“Terms”) form a binding agreement between you and{" "}
          <strong>TOGT Tour &amp; Travel (Togt Trading)</strong>, Jemo 1, Front of AK Building, 3rd
          Floor, Addis Ababa, Ethiopia (“TOGT”, “we”, “us”). They apply when you use the{" "}
          <strong>Togt Travel mobile application</strong> (package <strong>com.togt.travel</strong>),
          the website at <strong>https://travel.togttrading.com</strong>, or any booking, ticketing,
          visa, Umrah, tour or consulting service we provide.
        </p>
        <p>
          By creating an account, ticking an acceptance box, or using the app or Website, you agree to
          these Terms and to our <a href="/en/privacy">Privacy Policy</a> and{" "}
          <a href="/en/refund-policy">Refund Policy</a>. If you do not agree, do not use the service.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>
          You must be at least 18 years old and legally able to enter into contracts to create an
          account or book travel. If you book for other travellers, you confirm that you have their
          permission to share their personal and passport information with us and with airlines, visa
          authorities and suppliers.
        </p>
      </Section>

      <Section title="3. Accounts and Sign-In">
        <p>
          Accounts are created through Sign in with Google. You are responsible for keeping access to
          your Google account secure and for all activity under your Togt Travel account. Provide
          accurate, current information, especially names, dates of birth, passport numbers and expiry
          dates — errors can cause a booking or visa application to fail.
        </p>
        <p>
          We may suspend or terminate accounts that breach these Terms, are used for fraud, or remain
          inactive where required by law. You may request deletion of your account at any time as
          described in the Privacy Policy.
        </p>
      </Section>

      <Section title="4. Our Services">
        <p>
          TOGT arranges flight tickets, Umrah and Hajj-related packages, domestic and international
          tours, visa assistance, travel consulting and related support. We act as an intermediary
          between you and airlines, hotels, transport providers, guides, embassies and visa
          authorities. The actual transport, accommodation or visa is provided by those third parties
          under their own terms.
        </p>
        <p>
          Package descriptions, inclusions, exclusions and itineraries are indicative. We may change
          suppliers, routing, hotels or schedules where necessary, and will tell you about material
          changes before departure where reasonably possible.
        </p>
      </Section>

      <Section title="5. Bookings, Prices and Payment">
        <ul>
          <li>All bookings are subject to availability and confirmation by the airline, supplier or visa authority.</li>
          <li>Prices are shown in Ethiopian Birr unless another currency is stated, and may change until your booking is confirmed and paid.</li>
          <li>Payments are processed through <strong>Chapa</strong> and its banking partners. We do not store your full card details.</li>
          <li>A booking is confirmed only when we issue a confirmation and, for tickets, an e-ticket or airline booking reference.</li>
          <li>You are responsible for bank charges, currency-conversion differences and any payment-provider fees.</li>
          <li>Where a deposit is required, the balance must be paid by the stated deadline; otherwise the booking may be cancelled and the deposit treated under the supplier’s rules.</li>
        </ul>
      </Section>

      <Section title="6. Flights and Airline Rules">
        <p>
          Flight inventory and fares are provided through our airline distribution partner (Duffel) and
          the airlines. Airline conditions of carriage, fare rules, baggage allowances, schedule
          changes and refund rules apply in addition to these Terms. We are not the airline and do not
          control delays, cancellations, overbooking, denied boarding or route changes. Where an
          airline changes or cancels a flight, we will help you rebook or request a refund according to
          the airline’s rules.
        </p>
        <p>
          You must check that every passenger name matches the passport exactly. Name corrections and
          reissues may incur airline fees and are not guaranteed.
        </p>
      </Section>

      <Section title="7. Visa and Passport Services">
        <p>
          We help prepare and submit visa applications, but we are <strong>not a visa authority</strong>
          and do not decide outcomes. Visa approval, processing time and the visa itself are controlled
          by embassies and immigration authorities. <strong>Approval is never guaranteed</strong>, and
          fees paid to governments, embassies or processing centres may be non-refundable even if a
          visa is refused.
        </p>
        <p>
          You are responsible for holding a valid passport, meeting entry requirements, obtaining
          required vaccinations and complying with the laws of your destination. We are not liable for
          losses caused by refused entry, overstays, incorrect documents or information you withheld.
        </p>
      </Section>

      <Section title="8. Cancellations, Changes and Refunds">
        <p>
          Cancellation, change, reissue and refund conditions depend on the airline, supplier, package
          agreement, visa authority and how close the departure date is. Some fares and fees are
          non-refundable. Requests must be made in writing through Customer Support or the refund
          action in My Tickets, and take effect when we acknowledge them.
        </p>
        <p>
          Refunds are processed after the supplier approves them and may take several weeks. Service
          and processing fees already earned are not refundable. Full details are in our{" "}
          <a href="/en/refund-policy">Refund Policy</a>, which forms part of these Terms.
        </p>
      </Section>

      <Section title="9. Your Content and Uploaded Documents">
        <p>
          You keep ownership of the documents, photos, reviews and messages you upload. You grant TOGT
          a limited licence to store, copy and share them with airlines, visa authorities and suppliers
          strictly to deliver the services you requested, and to keep records as required by law.
        </p>
        <p>
          You confirm that you have the right to share every document you upload, including documents
          belonging to other travellers. Do not upload unlawful, misleading or third-party content
          without permission. We may remove content that breaches these Terms or applicable law.
        </p>
        <p>
          Reviews you post may be displayed publicly with your name. We may moderate or hide reviews
          that are abusive, false or unrelated to a genuine experience.
        </p>
      </Section>

      <Section title="10. Location and Group Tracking">
        <p>
          Group location features are optional and require your permission plus acceptance of a
          tracking request. When enabled, your live location is visible to the group’s guide and
          authorised TOGT staff, and to other members you have accepted, so the group can stay
          together and safety alerts can be raised. You can stop sharing at any time in the app or
          device settings; safety features may then be limited.
        </p>
      </Section>

      <Section title="11. Acceptable Use">
        <p>You must not:</p>
        <ul>
          <li>use the app or Website to break any law, commit fraud or book travel for someone without their consent;</li>
          <li>upload malware, attempt to access another user’s account or data, probe or overload our systems, or bypass security or rate limits;</li>
          <li>scrape, copy, resell or automate access to the service without our written permission;</li>
          <li>harass our staff or other users, or send abusive, hateful or threatening messages; or</li>
          <li>impersonate TOGT, an airline, an embassy or another person.</li>
        </ul>
      </Section>

      <Section title="12. Intellectual Property">
        <p>
          The Togt Travel name and logo, the Website, the app, and our text, design, software and
          original content are owned by TOGT or its licensors and protected by intellectual-property
          laws. You may use the service for personal, non-commercial travel purposes only. Airline
          names, logos and supplier content belong to their respective owners.
        </p>
      </Section>

      <Section title="13. Third-Party Services and Links">
        <p>
          The service relies on third parties including Google, Chapa, Duffel, airlines, Mapbox,
          Cloudflare, email and SMS providers, Firebase and AI support providers. Their terms and
          privacy policies apply to their part of the service. We are not responsible for third-party
          websites, apps or content that we do not control.
        </p>
      </Section>

      <Section title="14. Availability and Disclaimers">
        <p>
          We aim to keep the app and Website available, but we do not guarantee uninterrupted or
          error-free operation. Maintenance, network failures, supplier outages or events outside our
          control may interrupt the service.
        </p>
        <p>
          To the extent permitted by law, the service is provided “as is” and “as available”, and we
          disclaim implied warranties of merchantability, fitness for a particular purpose and
          non-infringement. Nothing in these Terms limits rights you have under mandatory consumer law.
        </p>
      </Section>

      <Section title="15. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, TOGT is not liable for indirect, incidental, special,
          consequential or punitive damages, or for lost profits, lost opportunities, missed flights,
          refused visas, supplier insolvency, or acts and omissions of airlines, embassies, hotels or
          other third parties.
        </p>
        <p>
          Where liability cannot be excluded, our total liability for a claim relating to a service is
          limited to the service fees TOGT actually charged you for that service, excluding amounts
          passed through to airlines, embassies and suppliers. This does not limit liability for fraud,
          death or personal injury caused by our negligence, or any liability that cannot be limited by
          law.
        </p>
      </Section>

      <Section title="16. Indemnity">
        <p>
          You agree to indemnify TOGT against reasonable losses, claims and costs arising from your
          breach of these Terms, inaccurate information or documents you provided, or your unlawful use
          of the service.
        </p>
      </Section>

      <Section title="17. Termination">
        <p>
          We may suspend or terminate your access if you breach these Terms, if required by law, or to
          protect other users or our systems. You may stop using the service and request account
          deletion at any time. Sections that by their nature should survive termination — including
          payment obligations, intellectual property, disclaimers, liability limits and dispute
          resolution — continue to apply.
        </p>
      </Section>

      <Section title="18. Governing Law and Disputes">
        <p>
          These Terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Before
          starting formal proceedings, please contact us at <strong>info@togttrading.com</strong> so we
          can try to resolve the issue. If we cannot resolve it within 30 days, disputes will be
          submitted to the competent courts of Addis Ababa, Ethiopia, unless mandatory consumer law in
          your country gives you the right to sue in your local courts.
        </p>
      </Section>

      <Section title="19. Changes to These Terms">
        <p>
          We may update these Terms as our services or the law change. The new version will be posted
          here with a new “Last updated” date. For material changes we will notify you in the app or by
          email. Continuing to use the service after the effective date means you accept the updated
          Terms.
        </p>
      </Section>

      <Section title="20. Contact">
        <p>
          <strong>TOGT Tour &amp; Travel (Togt Trading)</strong>
          <br />
          Jemo 1, Front of AK Building, 3rd Floor
          <br />
          Addis Ababa, Ethiopia
          <br />
          Email: <strong>info@togttrading.com</strong>
          <br />
          Phone: <strong>+251 99 797 9741</strong> / <strong>+251 99 797 9740</strong>
        </p>
      </Section>
    </ResourcePage>
  );
}
