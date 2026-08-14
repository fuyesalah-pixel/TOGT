import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // English & Arabic are fully translated. Amharic (am) & Oromiffa (om) are
  // placeholder dictionaries (fallback to English content) until translations
  // are provided by the client.
  locales: ["en", "ar", "am", "om"],
  defaultLocale: "en",
});

export type AppLocale = (typeof routing.locales)[number];
