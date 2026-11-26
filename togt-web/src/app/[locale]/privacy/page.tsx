import type { Metadata } from "next";
import { ResourcePage, Section } from "@/components/site/resource-page";

export const metadata: Metadata = {
  title: "Privacy Policy | TOGT Tour & Travel",
  description:
    "How the Togt Travel mobile app and travel.togttrading.com collect, use, share, retain and delete your personal information.",
};

const LAST_UPDATED = "26 November 2026";

export default function PrivacyPage() {
  return (
    <ResourcePage
      title="Privacy Policy"
      subtitle="How TOGT Tour & Travel handles your information in the Togt Travel app and on our website."
    >
      <p className="mb-8 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

      <Section title="1. Who We Are and What This Policy Covers">
        <p>
          This Privacy Policy explains how <strong>TOGT Tour &amp; Travel</strong> (“TOGT”, “we”, “us”)
          collects, uses, shares, retains and protects personal information. It applies to both:
        </p>
        <ul>
          <li>
            the <strong>“Togt Travel” mobile application</strong> for Android (package{" "}
            <strong>com.togt.travel</strong>, published on Google Play) and iOS; and
          </li>
          <li>
            our website at <strong>https://travel.togttrading.com</strong> (the “Website”).
          </li>
        </ul>
        <p>
          The app and the Website share one account and one backend, so information collected in
          either place is handled under this single policy. The data controller is TOGT Tour &amp;
          Travel (Togt Trading), Jemo 1, Front of AK Building, 3rd Floor, Addis Ababa, Ethiopia.
        </p>
        <p>
          This policy does not cover third-party websites or apps we link to, including airline,
          embassy, hotel or payment pages. Those services have their own privacy policies.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p>We collect the following categories of information:</p>
        <p>
          <strong>Account and identity data.</strong> When you sign in with Google, we receive your
          Google account identifier, name, email address and profile photo. You may add a phone
          number, address, date of birth, nationality, language preference and a profile avatar.
        </p>
        <p>
          <strong>Passport and travel-document data.</strong> To arrange visas, tickets and Umrah or
          tour packages, we collect passport number, passport issue and expiry dates, and scanned
          copies of passports, national IDs or other documents you upload. Flight bookings also
          require passenger names, dates of birth, gender and travel-document details.
        </p>
        <p>
          <strong>Booking and service data.</strong> Package selections, service requests (tickets,
          Umrah, domestic and tourist tours, visa assistance, consulting, foreign travel), itineraries,
          ticket numbers, flight orders, group and tour-plan membership, seat and baggage selections,
          reviews you post, and support conversations with our team.
        </p>
        <p>
          <strong>Payment data.</strong> Payment amount, currency, status, transaction reference and
          the service it relates to. Card and wallet details are entered on our payment provider’s
          secure page; <strong>we do not receive or store your full card number</strong>.
        </p>
        <p>
          <strong>Location data.</strong> If you grant permission and accept a tracking request, the
          app collects precise device location (latitude, longitude and accuracy) while you are on an
          active group trip. We use it to show group members on the map, keep travellers and guides
          together, and raise safety (geofence) alerts.
        </p>
        <p>
          <strong>Device and technical data.</strong> Push-notification tokens (Firebase Cloud
          Messaging), device type and platform, known-device fingerprints, browser and operating
          system, IP address, login and security events, and profile-change history.
        </p>
        <p>
          <strong>Communications.</strong> Messages, attachments and photos you send through in-app
          chat, support tickets, the Website chat assistant, email, SMS or our Telegram support bot.
        </p>
      </Section>

      <Section title="3. How We Collect Information">
        <ul>
          <li>Directly from you when you create an account, complete a form, upload documents, book a service, pay or contact support.</li>
          <li>From Google when you choose “Sign in with Google”.</li>
          <li>From your device when you enable notifications or grant location permission.</li>
          <li>Automatically from your use of the app and Website (IP address, device information, security logs).</li>
          <li>From our staff and call-centre team, who record enquiries and bookings made by phone or in person.</li>
          <li>From airlines, payment providers and travel suppliers confirming a booking or payment.</li>
        </ul>
      </Section>

      <Section title="4. Why We Use Your Information and Our Legal Bases">
        <p>We use personal information to:</p>
        <ul>
          <li>create and secure your account and sign you in;</li>
          <li>process bookings, issue tickets, arrange visas, Umrah and tour packages, and manage group travel;</li>
          <li>take and verify payments and manage refunds;</li>
          <li>provide customer support, in-app chat and notifications about your bookings;</li>
          <li>show consented group location on maps and send safety or geofence alerts during a trip;</li>
          <li>send service messages by email, SMS, push notification or Telegram;</li>
          <li>detect fraud, abuse and unauthorised access, and keep audit logs;</li>
          <li>comply with tax, accounting, immigration and airline requirements; and</li>
          <li>improve our services and, where permitted, send offers you can opt out of.</li>
        </ul>
        <p>
          Where data-protection law requires a legal basis, we rely on: <strong>performance of a
          contract</strong> (providing the travel services you request), <strong>legal
          obligation</strong> (tax, accounting and immigration records), <strong>legitimate
          interests</strong> (security, fraud prevention, service improvement), and{" "}
          <strong>consent</strong> (precise location tracking, optional marketing and non-essential
          notifications). You can withdraw consent at any time without affecting past processing.
        </p>
      </Section>

      <Section title="5. Cookies and Similar Technologies">
        <p>
          The Website uses strictly necessary cookies and local storage to keep you signed in, protect
          against cross-site request forgery, remember your language and theme, and store short-lived
          session data. The app stores your session token and preferences on your device.
        </p>
        <p>
          We do not use advertising cookies or third-party behavioural advertising trackers. Map tiles
          are loaded from Mapbox and may set technical cookies or receive your IP address as part of
          that request. You can block or clear cookies in your browser, but signing in and booking may
          stop working.
        </p>
      </Section>

      <Section title="6. How We Share Information">
        <p>
          We do not sell your personal information. We share only what is necessary with the following
          categories of recipients:
        </p>
        <ul>
          <li><strong>Google</strong> — Sign in with Google authentication and Firebase Cloud Messaging for push notifications.</li>
          <li><strong>Duffel and airlines</strong> — passenger and travel-document details needed to search, hold, ticket and manage flights.</li>
          <li><strong>Chapa</strong> — payment initiation, verification and refunds. Payment details are processed by Chapa and its banking partners.</li>
          <li><strong>Cloudflare R2</strong> — encrypted storage for uploaded passport scans, ID images, ticket files, review photos and chat attachments.</li>
          <li><strong>Resend and Hostinger SMTP</strong> — delivery of transactional email such as booking confirmations, reminders and verification messages.</li>
          <li><strong>SMSEthiopia</strong> — delivery of transactional SMS to the phone number on your account.</li>
          <li><strong>Mapbox</strong> — map display and location rendering.</li>
          <li><strong>AI support providers</strong> (Google Gemini, OpenAI or OpenRouter, depending on configuration) — the text of your message to our chat assistant is processed to generate a reply.</li>
          <li><strong>Telegram</strong> — our staff support bot and internal operational notifications.</li>
          <li><strong>Travel suppliers</strong> — hotels, transport companies, guides, visa-processing partners and embassies/visa authorities, where needed to deliver the service you requested.</li>
          <li><strong>Hosting and IT providers</strong> — our server host and infrastructure providers that run the app and Website under our instructions.</li>
          <li><strong>Authorities and professional advisers</strong> — where required by law, court order, immigration rules or to establish or defend legal claims.</li>
        </ul>
        <p>
          Our staff can see the information needed to serve you. Access is role-based, and sensitive
          documents such as passport scans are restricted to the staff handling your request.
        </p>
      </Section>

      <Section title="7. International Transfers">
        <p>
          We are based in Ethiopia, and some of our service providers process data outside Ethiopia,
          including in the United States and the European Union. Where required, we use appropriate
          safeguards such as standard contractual clauses and provider security commitments. Because
          airlines and visa authorities operate globally, your booking data may be transferred to the
          country of travel or the issuing authority.
        </p>
      </Section>

      <Section title="8. How We Protect Information">
        <p>
          We use HTTPS/TLS for data in transit, role-based access control, hashed credentials for staff
          accounts, signed short-lived links for private files, audit logging, rate limiting and
          encrypted storage for provider secrets. No system is completely secure; please use a strong,
          unique Google account password and tell us immediately if you suspect unauthorised access.
        </p>
      </Section>

      <Section title="9. How Long We Keep Information">
        <ul>
          <li><strong>Account profile</strong> — while your account is active. When you delete your account it is erased or anonymised immediately; copies leave our rolling backups within 30 days.</li>
          <li><strong>Bookings, tickets, invoices and payment records</strong> — up to 7 years after the transaction, as required for tax, accounting and airline audit purposes.</li>
          <li><strong>Passport, ID and visa documents</strong> — for the duration of the service and up to 90 days afterwards, unless an airline, embassy or law requires longer.</li>
          <li><strong>Support chats, tickets and call records</strong> — up to 2 years after the last interaction.</li>
          <li><strong>Precise location history</strong> — up to 90 days; geofence/safety alerts up to 12 months.</li>
          <li><strong>Security and audit logs</strong> — up to 12 months.</li>
          <li><strong>Backups</strong> — rolling backups retained for up to 30 days.</li>
          <li><strong>Marketing preferences</strong> — until you opt out, plus a suppression record so we do not contact you again.</li>
        </ul>
        <p>
          When a retention period ends, we delete or irreversibly anonymise the data. We may keep
          aggregated statistics that no longer identify you.
        </p>
      </Section>

      <Section title="10. Account and Data Deletion">
        <p>
          <strong>Delete in the app (recommended).</strong> Open the Togt Travel app, go to the{" "}
          <strong>Profile</strong> tab, tap <strong>Delete my account</strong>, type <strong>DELETE</strong>{" "}
          to confirm, then confirm the final prompt. Deletion takes effect immediately: we erase or
          anonymise your profile and personal data, remove your uploaded files, and revoke your
          sessions on every device.
        </p>
        <p>
          <strong>Delete by email.</strong> If you cannot use the app, email{" "}
          <strong>info@togttrading.com</strong> from the email address linked to your account with the
          subject <strong>“Delete my account”</strong>. You can also call{" "}
          <strong>+251 99 797 9741</strong> or <strong>+251 99 797 9740</strong>, or ask our team in
          in-app support chat. Full instructions are published at{" "}
          <a href="/en/delete-account">https://travel.togttrading.com/en/delete-account</a>.
        </p>
        <p>For an email request we will:</p>
        <ol>
          <li>verify that the request comes from the account holder (usually by replying to the registered email);</li>
          <li>delete or anonymise your profile, uploaded documents, chat messages, reviews, device tokens and location history;</li>
          <li>cancel active marketing communication and revoke your sessions; and</li>
          <li>confirm completion within 30 days.</li>
        </ol>
        <p>
          We may retain limited records where the law requires it — for example paid invoices,
          ticketing records or documents an airline or visa authority still needs. Those records stay
          protected and are used only for that purpose. Deleting your account does not automatically
          cancel an active booking; contact us first if you need a booking cancelled.
        </p>
      </Section>

      <Section title="11. Your Rights">
        <p>
          Subject to applicable law, including Ethiopia’s personal-data protection rules and the GDPR
          where it applies, you may:
        </p>
        <ul>
          <li>access a copy of the personal data we hold about you;</li>
          <li>correct inaccurate or incomplete data;</li>
          <li>request deletion (see section 10);</li>
          <li>restrict or object to certain processing, including direct marketing;</li>
          <li>withdraw consent for location tracking or optional notifications at any time in your device or app settings;</li>
          <li>receive your data in a portable format where technically feasible; and</li>
          <li>complain to a data-protection authority.</li>
        </ul>
        <p>
          To exercise a right, email <strong>info@togttrading.com</strong>. We respond within 30 days
          and may ask for information to verify your identity.
        </p>
      </Section>

      <Section title="12. Children’s Privacy">
        <p>
          The app and Website are intended for adults aged 18 or over. We do not knowingly collect
          personal data from children. Travellers under 18 must be booked by a parent or guardian, who
          is responsible for their information. If you believe a child has provided us data, contact us
          and we will delete it.
        </p>
      </Section>

      <Section title="13. Automated Processing">
        <p>
          Our chat assistant and translation features use automated systems to draft replies and
          translate content. We do not make decisions with legal or similarly significant effects about
          you solely by automated means; bookings and refunds are reviewed by our staff.
        </p>
      </Section>

      <Section title="14. Changes to This Policy">
        <p>
          We may update this policy to reflect changes in the app, the law or our providers. We will
          post the new version here with a new “Last updated” date and, for material changes, notify
          you in the app or by email.
        </p>
      </Section>

      <Section title="15. Contact Us">
        <p>
          Privacy requests and questions:
        </p>
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
