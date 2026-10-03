"use client";

import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listSiteSettings, updateSiteSettings, type SiteSettingRow } from "@/lib/api/siteSettings";
import { useToast } from "@/components/providers";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Button } from "@/components/ui/button";

/**
 * Admin "About Section" tab — controls the public "About TOGT" section on the
 * home page: the story text and the YouTube video link (ABOUT_TEXT /
 * ABOUT_VIDEO_URL site settings).
 */
export function AboutControlTab() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [aboutVideoUrl, setAboutVideoUrl] = useState("");
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setError("");
    try {
      const data: SiteSettingRow[] = await listSiteSettings();
      const map = Object.fromEntries(data.map((row) => [row.key, row.value]));
      setRows(map);
      setAboutText(map.ABOUT_TEXT ?? "");
      setAboutVideoUrl(map.ABOUT_VIDEO_URL ?? "");
      setDirty(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load the About section.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateSiteSettings([
        { key: "ABOUT_TEXT", value: aboutText },
        { key: "ABOUT_VIDEO_URL", value: aboutVideoUrl.trim() },
      ]);
      setRows((current) => ({ ...current, ABOUT_TEXT: aboutText, ABOUT_VIDEO_URL: aboutVideoUrl.trim() }));
      setDirty(false);
      showToast({ title: "About section updated", message: "The home-page About text and video are now live." });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the About section.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading About section…</p>;

  return (
    <div>
      <PageHeader
        title="About Section"
        description="Edit the story text and the YouTube video shown in the “About TOGT” section on the home page."
      />

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-togt-orange/10 text-togt-orange">
            <Video className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-togt-navy">About section (home page)</p>
            <p className="mt-0.5 max-w-xl text-sm text-gray-500">
              Leave the video link empty to show text only. Changes go live immediately after saving.
            </p>
            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">About text</span>
                <textarea
                  rows={6}
                  value={aboutText}
                  onChange={(event) => { setAboutText(event.target.value); setDirty(true); }}
                  placeholder="Tell customers who TOGT is — shown instead of the default text when set."
                  className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Video link (YouTube)</span>
                <input
                  value={aboutVideoUrl}
                  onChange={(event) => { setAboutVideoUrl(event.target.value); setDirty(true); }}
                  placeholder="https://www.youtube.com/watch?v=… (leave empty to hide the video)"
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                />
              </label>
              <div className="flex items-center gap-3">
                <Button onClick={() => void save()} disabled={saving || !dirty} className="bg-togt-blue text-white hover:bg-togt-blue/90">
                  {saving ? "Saving…" : "Save About section"}
                </Button>
                {dirty && !saving && <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
