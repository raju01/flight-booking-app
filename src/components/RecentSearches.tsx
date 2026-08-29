"use client";

import { useEffect, useState } from "react";
import { loadSearchHistory } from "@/lib/searchHistory";
import { SearchHistoryEntry } from "@/types/searchHistory";
import { ClockIcon } from "@/components/icons";

export default function RecentSearches({
  onSelect,
}: {
  onSelect: (entry: SearchHistoryEntry) => void;
}) {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>([]);

  useEffect(() => {
    // Reads localStorage (unavailable during SSR) after mount to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(loadSearchHistory());
  }, []);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
        <ClockIcon className="w-3.5 h-3.5" />
        Recent searches
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry)}
            className="shrink-0 flex items-center gap-1.5 rounded-full border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            {entry.from} → {entry.to}
            {entry.tripType === "round-trip" && (
              <span className="text-slate-400 font-normal">round trip</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
