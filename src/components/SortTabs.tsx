"use client";

import { formatPrice } from "@/lib/currency";

export type SortKey = "best" | "price" | "duration";

export interface SortSummary {
  best: { price: number; minutes: number };
  price: { price: number; minutes: number };
  duration: { price: number; minutes: number };
}

function formatDuration(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

const TABS: { key: SortKey; label: string }[] = [
  { key: "best", label: "Best" },
  { key: "price", label: "Cheapest" },
  { key: "duration", label: "Fastest" },
];

// Kayak and Skyscanner style tabs: each shows what you get if you pick it.
export default function SortTabs({
  value,
  onChange,
  summary,
}: {
  value: string; // the page can sort by more than these three, in which case no tab is highlighted
  onChange: (key: SortKey) => void;
  summary: SortSummary;
}) {
  return (
    <div role="tablist" aria-label="Sort flights" className="grid grid-cols-3 gap-2 mb-4">
      {TABS.map(({ key, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={`rounded-2xl border-2 px-3 py-2.5 text-left transition-all cursor-pointer ${
              active
                ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
                : "border-slate-200 bg-white hover:border-indigo-300"
            }`}
          >
            <p className={`text-sm font-bold ${active ? "text-indigo-700" : "text-slate-800"}`}>{label}</p>
            <p className="text-xs text-slate-500">
              {formatPrice(summary[key].price)} · {formatDuration(summary[key].minutes)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
