import type { Metadata } from "next";
import { ResourcePage, Section } from "@/components/site/resource-page";

export const metadata: Metadata = {
  title: "Delete Your Account | TOGT Tour & Travel",
  description:
    "How to delete your Togt Travel account and personal data from the app or by email, what is erased, and what we must keep for legal records.",
};

export default function DeleteAccountPage() {
  return (
    <ResourcePage
      title="Delete Your Account"
      subtitle="How to permanently delete your Togt Travel account and the personal data linked to it."
    >
      <Section title="Delete your account in the app">
        <p>
          The fastest way to delete your account is directly in the <strong>Togt Travel</strong> mobile
          app (package <strong>com.togt.travel</strong>). You do not need to email us or wait for a
          reply.
        </p>
        <ol>
          <li>Open the Togt Travel app and sign in.</li>
          <li>Go to the <strong>Profile</strong> tab.</li>
          <li>Tap <strong>Delete my account</strong>.</li>
          <li>Read the warning and type <strong>DELETE</strong> to confirm.</li>
          <li>Tap <strong>Delete my account</strong> and confirm the final prompt.</li>
        </ol>
        <p>
          The deletion takes effect immediately. You are signed out everywhere and can no longer sign
          in with that account. If you sign in with the same Google account again later, a new, empty
          Togt Travel account is created.
        </p>
      </Section>

      <Section title="Delete your account by email">
        <p>
          If you cannot use the app, email <strong>info@togttrading.com</strong> from the email address
          linked to your account, with the subject <strong>“Delete my account”</strong>. You can also
          call <strong>+251 99 797 9741</strong> or <strong>+251 99 797 9740</strong>, or ask our team
          in in-app support chat.
        </p>
        <p>
          We may reply to confirm that the request comes from the account holder. We complete verified
          email requests within 30 days.
        </p>
      </Section>

      <Section title="What we delete">
        <ul>
          <li>Your name, email, phone number, address, date of birth and nationality.</li>
          <li>Your passport number, passport issue and expiry dates, and passport/ID scans you uploaded.</li>
          <li>Your profile photo, review photos and chat attachments.</li>
          <li>Your chat messages, reviews and support conversations.</li>
          <li>Push-notification tokens, known-device fingerprints and saved login devices.</li>
          <li>Your precise location history, tracking requests and geofence alerts.</li>
          <li>Your group memberships and profile-change history.</li>
          <li>Your account itself — it is anonymised and terminated, and all sessions are revoked.</li>
        </ul>
      </Section>

      <Section title="What we must keep">
        <p>
          We keep a limited set of records where the law or our suppliers require it, for the periods
          described in our <a href="/en/privacy">Privacy Policy</a>:
        </p>
        <ul>
          <li>
            <strong>Paid invoices, tickets, flight orders and payment records</strong> — up to 7 years
            for tax, accounting and airline audit purposes. These records are no longer linked to a
            usable profile.
          </li>
          <li>
            <strong>Records an airline, embassy or visa authority still needs</strong> for an active
            booking or application.
          </li>
          <li>
            <strong>Rolling backups</strong> — deleted data leaves our backups within 30 days.
          </li>
        </ul>
        <p>
          Deleting your account does <strong>not</strong> cancel an active booking or start a refund.
          Contact support before deleting if you still need to travel or want to cancel a booking.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about deletion or your data:
          <br />
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
