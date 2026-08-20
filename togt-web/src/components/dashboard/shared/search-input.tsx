"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Debounced (300ms) search field. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [inner, setInner] = useState(value);

  useEffect(() => setInner(value), [value]);

  useEffect(() => {
    const timer = setTimeout(() => onChange(inner), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inner]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        value={inner}
        onChange={(e) => setInner(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
