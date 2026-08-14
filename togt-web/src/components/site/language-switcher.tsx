"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  ar: "العربية",
  am: "አማርኛ",
  om: "Oromiffa",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        if (value) {
          router.replace(pathname, { locale: value });
        }
      }}
    >
      <SelectTrigger className="w-[110px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(LOCALE_LABELS).map(([code, label]) => (
          <SelectItem key={code} value={code}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
