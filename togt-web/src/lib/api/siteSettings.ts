import { apiGet, apiPost } from "./client";

export type SiteSettings = {
  OKRA_LINK: string;
  OKRA_IMAGE: string;
  TICKETING_ENABLED: string;
  ABOUT_VIDEO_URL: string;
  ABOUT_TEXT: string;
};

export type SiteSettingRow = { key: string; value: string; updatedAt: string | null; updatedBy: string | null };

export const getPublicSiteSettings = () => apiGet<SiteSettings>("/site-settings/public");
export const listSiteSettings = () => apiGet<SiteSettingRow[]>("/site-settings");
export const updateSiteSettings = (settings: Array<{ key: string; value: string }>) =>
  apiPost<SiteSettings>("/site-settings", { settings });
