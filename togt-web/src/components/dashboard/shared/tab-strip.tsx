"use client";

import { cn } from "@/lib/utils";

export interface TabDef {
  id: string;
  label: string;
}

export function TabStrip({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" aria-label="Dashboard sections" className="mb-6 flex flex-wrap gap-1 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          role="tab"
          aria-selected={active === tab.id}
          tabIndex={active === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative px-4 py-2.5 text-sm font-medium transition-colors",
            active === tab.id ? "text-togt-navy" : "text-gray-500 hover:text-togt-navy",
          )}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-togt-orange" />
          )}
        </button>
      ))}
    </div>
  );
}
