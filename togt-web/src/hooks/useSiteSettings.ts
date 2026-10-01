"use client";

import { useEffect, useState } from "react";
import { getPublicSiteSettings, type SiteSettings } from "@/lib/api/siteSettings";

let cache: SiteSettings | null = null;
const listeners = new Set<(settings: SiteSettings) => void>();
let inflight: Promise<SiteSettings> | null = null;

const DEFAULTS: SiteSettings = { OKRA_LINK: "https://okratech.et", OKRA_IMAGE: "", TICKETING_ENABLED: "true", ABOUT_VIDEO_URL: "", ABOUT_TEXT: "" };

async function load(): Promise<SiteSettings> {
  if (cache) return cache;
  if (!inflight) {
    inflight = getPublicSiteSettings()
      .then((settings) => {
        cache = { ...DEFAULTS, ...settings };
        listeners.forEach((listener) => listener(cache as SiteSettings));
        return cache as SiteSettings;
      })
      .catch(() => {
        // API unreachable — fall back to defaults so the site renders normally.
        return DEFAULTS;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Public site settings (footer credit, ticketing toggle) shared across the page. */
export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(cache ?? DEFAULTS);
  useEffect(() => {
    let active = true;
    listeners.add(setSettings);
    void load().then((result) => {
      if (active) setSettings(result);
    });
    return () => {
      active = false;
      listeners.delete(setSettings);
    };
  }, []);
  return settings;
}
