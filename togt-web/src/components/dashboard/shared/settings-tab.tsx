"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserMutations } from "@/hooks/useUsers";
import { apiPost } from "@/lib/api/client";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SettingsTab() {
  const { user, logout } = useAuth();
  const { updateUser } = useUserMutations();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    birthday: "",
    nationality: "",
    passportNumber: "",
    passportIssueDate: "",
    passportExpiry: "",
    languagePref: "en",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName ?? "",
        phone: user.phone ?? "",
        address: user.address ?? "",
        birthday: user.birthday ? user.birthday.slice(0, 10) : "",
        nationality: user.nationality ?? "",
        passportNumber: user.passportNumber ?? "",
        passportIssueDate: user.passportIssueDate ? user.passportIssueDate.slice(0, 10) : "",
        passportExpiry: user.passportExpiry ? user.passportExpiry.slice(0, 10) : "",
        languagePref: user.languagePref ?? "en",
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    try {
      await updateUser.mutateAsync({
        id: user.id,
        dto: {
          fullName: form.fullName || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          birthday: form.birthday || undefined,
          nationality: form.nationality || undefined,
          passportNumber: form.passportNumber || undefined,
          passportIssueDate: form.passportIssueDate || undefined,
          passportExpiry: form.passportExpiry || undefined,
          languagePref: form.languagePref,
        },
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and preferences" />

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">Profile</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+251..."
            />
          </div>
          <div>
            <Label htmlFor="passportNumber">Passport number</Label>
            <Input
              id="passportNumber"
              value={form.passportNumber}
              onChange={(e) => setForm({ ...form, passportNumber: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Bole, Addis Ababa" />
          </div>
          <div>
            <Label htmlFor="birthday">Birthday</Label>
            <Input id="birthday" type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="nationality">Nationality</Label>
            <Input id="nationality" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="Ethiopian" />
          </div>
          <div>
            <Label htmlFor="passportExpiry">Passport expiry</Label>
            <Input
              id="passportExpiry"
              type="date"
              value={form.passportExpiry}
              onChange={(e) => setForm({ ...form, passportExpiry: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="passportIssueDate">Passport issue date</Label>
            <Input id="passportIssueDate" type="date" value={form.passportIssueDate} onChange={(e) => setForm({ ...form, passportIssueDate: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="languagePref">Preferred language</Label>
            <select
              id="languagePref"
              value={form.languagePref}
              onChange={(e) => setForm({ ...form, languagePref: e.target.value })}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="en">English</option>
              <option value="am">አማርኛ (Amharic)</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="om">Afaan Oromoo</option>
            </select>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {saved && <p className="mt-3 text-sm text-emerald-600">Profile saved.</p>}

        <div className="mt-5">
          <Button
            onClick={handleSave}
            disabled={updateUser.isPending}
            className="bg-togt-blue text-white hover:bg-togt-blue/90"
          >
            {updateUser.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">Account</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-400">Email</dt>
            <dd className="font-medium text-togt-navy">{user.email}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Role</dt>
            <dd><StatusBadge value={user.role} /></dd>
          </div>
          <div>
            <dt className="text-gray-400">Status</dt>
            <dd><StatusBadge value={user.status} /></dd>
          </div>
          <div>
            <dt className="text-gray-400">Member since</dt>
            <dd className="font-medium text-togt-navy">
              {new Date(user.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      {(user.role === "ADMIN" || user.role === "TECH") && <EmailDeliveryTestCard />}
      {(user.role === "ADMIN" || user.role === "TECH") && <SmsDeliveryTestCard />}

      <div className="mt-4 rounded-xl border border-red-100 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-red-400">Session</h2>
        <p className="mb-4 text-sm text-gray-500">Sign out of your account on this device.</p>
        <Button variant="destructive" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  );
}

/** ADMIN/TECH only: send a test email through the production delivery stack
 *  (Resend first, Hostinger SMTP fallback) and report which provider fired. */
function EmailDeliveryTestCard() {
  const { user } = useAuth();
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; provider: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<{ ok: boolean; provider: string; to: string }>("/notifications/test-email", { to: to.trim() || undefined });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the test email.");
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mt-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">Email delivery test</h2>
      <p className="mb-3 text-sm text-gray-500">
        Sends a test email through the same delivery stack used for bulk email — Resend when configured, with the
        Hostinger mailbox as fallback — and reports which provider delivered it.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder={`Recipient (default: ${user.email})`} className="max-w-xs" />
        <Button onClick={() => void send()} disabled={sending} className="bg-togt-blue text-white hover:bg-togt-blue/90">
          {sending ? "Sending…" : "Send test email"}
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {result && (
        <p className={`mt-3 text-sm ${result.ok ? "text-emerald-600" : "text-red-600"}`}>
          {result.ok
            ? `Test email sent via ${result.provider === "resend" ? "Resend" : "Hostinger SMTP"}. Check the inbox (and spam folder) to confirm.`
            : "No email provider is configured — add the Resend key in Tech Dashboard → Providers (or the RESEND_API_KEY env)."}
        </p>
      )}
    </div>
  );
}

/** ADMIN/TECH only: send a test SMS through the SMSEthiopia gateway used for
 *  bulk SMS, reporting whether the credential exists and the message fired. */
function SmsDeliveryTestCard() {
  const { user } = useAuth();
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; reason?: string; to: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<{ ok: boolean; reason?: string; to: string }>("/notifications/test-sms", { to: to.trim() || undefined });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the test SMS.");
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mt-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">SMS delivery test</h2>
      <p className="mb-3 text-sm text-gray-500">
        Sends a test SMS through the same SMSEthiopia gateway used for bulk notifications and status updates. Leave
        empty to send to the phone number on your profile.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient phone, e.g. +251912345678" className="max-w-xs" />
        <Button onClick={() => void send()} disabled={sending} className="bg-togt-blue text-white hover:bg-togt-blue/90">
          {sending ? "Sending…" : "Send test SMS"}
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {result && (
        <p className={`mt-3 text-sm ${result.ok ? "text-emerald-600" : "text-red-600"}`}>
          {result.ok
            ? `Test SMS sent to ${result.to}. Check the phone to confirm delivery.`
            : result.reason ?? "SMS delivery failed."}
        </p>
      )}
    </div>
  );
}
