import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  // RequestStatus / GroupStatus
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  UPCOMING: "bg-sky-100 text-sky-700",
  // User status
  ACTIVE: "bg-emerald-100 text-emerald-700",
  TERMINATED: "bg-red-100 text-red-700",
  // Roles
  CUSTOMER: "bg-slate-100 text-slate-700",
  WORKER: "bg-blue-100 text-blue-700",
  GUIDE: "bg-purple-100 text-purple-700",
  ADMIN: "bg-togt-orange/15 text-togt-orange",
  TECH: "bg-cyan-100 text-cyan-700",
  PAID: "bg-emerald-100 text-emerald-700",
  UNPAID: "bg-orange-100 text-orange-700",
  REFUNDED: "bg-red-100 text-red-700",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[value] ?? "bg-gray-100 text-gray-600",
      )}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}
