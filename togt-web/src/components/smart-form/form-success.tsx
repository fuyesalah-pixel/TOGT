"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FormSuccess({ onReset }: { onReset: () => void }) {
  const t = useTranslations("SmartForm.common");

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <CheckCircle2 className="h-12 w-12 text-green-500" />
      <h3 className="text-xl font-semibold text-togt-navy">{t("successTitle")}</h3>
      <p className="max-w-md text-muted-foreground">{t("successBody")}</p>
      <Button variant="outline" onClick={onReset} className="mt-2">
        Submit another request
      </Button>
    </div>
  );
}
