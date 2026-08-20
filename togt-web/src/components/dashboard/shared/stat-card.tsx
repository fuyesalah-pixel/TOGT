import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const accents = {
  blue: "bg-togt-blue/10 text-togt-blue",
  orange: "bg-togt-orange/10 text-togt-orange",
  navy: "bg-togt-navy/10 text-togt-navy",
  green: "bg-emerald-100 text-emerald-600",
  red: "bg-red-100 text-red-600",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "blue",
  hint,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: keyof typeof accents;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {Icon && (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", accents[accent])}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-togt-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
