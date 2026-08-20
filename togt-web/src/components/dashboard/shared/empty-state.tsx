import { Inbox } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Inbox className="h-6 w-6 text-gray-400" />
      </div>
      <p className="font-semibold text-togt-navy">{title}</p>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
    </div>
  );
}
