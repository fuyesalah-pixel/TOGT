"use client";

import { useEffect, useState } from "react";
import { Plane, ToggleLeft, ToggleRight } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listSiteSettings, updateSiteSettings, type SiteSettingRow } from "@/lib/api/siteSettings";
import { useToast } from "@/components/providers";

/**
 * Admin "Site Control" tab — global site switches.
 * Currently controls the public ticketing section ("TOGT Flight Desk ·
 * Book your journey") which can be hidden from all customers.
 */
export function SiteControlTab() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const data: SiteSettingRow[] = await listSiteSettings();
      setRows(Object.fromEntries(data.map((row) => [row.key, row.value])));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load site settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const ticketingEnabled = (rows.TICKETING_ENABLED ?? "true") !== "false";

  const saveTicketing = async (enabled: boolean) => {
    setSaving(true);
    setError("");
    try {
      await updateSiteSettings([{ key: "TICKETING_ENABLED", value: enabled ? "true" : "false" }]);
      setRows((current) => ({ ...current, TICKETING_ENABLED: enabled ? "true" : "false" }));
      showToast({
        title: enabled ? "Ticketing section shown" : "Ticketing section hidden",
        message: enabled
          ? "The TOGT Flight Desk section is visible to all customers."
          : "The TOGT Flight Desk section is now hidden from all customers.",
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the setting.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading site settings…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-togt-navy">Site Control</h2>
        <p className="mt-1 text-sm text-gray-500">Global switches that change what customers see on the public website.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-togt-blue/10 text-togt-blue">
              <Plane className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-togt-navy">Ticketing section</p>
              <p className="mt-0.5 max-w-xl text-sm text-gray-500">
                “TOGT Flight Desk — Book your journey” on the home page. When off, the whole flight booking wizard is
                hidden from all customers.
              </p>
              <p className={`mt-2 text-xs font-bold ${ticketingEnabled ? "text-green-600" : "text-red-500"}`}>
                {ticketingEnabled ? "Visible to customers" : "Hidden from all customers"}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={ticketingEnabled}
            disabled={saving}
            onClick={() => void saveTicketing(!ticketingEnabled)}
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
              ticketingEnabled ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-red-50 text-red-600 hover:bg-red-100"
            } disabled:opacity-60`}
          >
            {ticketingEnabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            {ticketingEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>
    </div>
  );
}
