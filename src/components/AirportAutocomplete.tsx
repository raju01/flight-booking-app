"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AIRPORTS } from "@/lib/airports";
import { Airport } from "@/types/flight";

function matchScore(airport: Airport, query: string): number {
  const q = query.toLowerCase();
  const code = airport.code.toLowerCase();
  const city = airport.city.toLowerCase();
  const name = airport.name.toLowerCase();
  const aliases = airport.aliases ?? [];

  if (code === q) return 0;
  if (code.startsWith(q)) return 1;
  if (city.startsWith(q) || aliases.some((a) => a.startsWith(q))) return 2;
  if (city.includes(q) || aliases.some((a) => a.includes(q))) return 3;
  if (name.includes(q)) return 4;
  return -1;
}

function searchAirports(query: string, exclude?: string): Airport[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  return AIRPORTS.map((a) => ({ airport: a, score: matchScore(a, trimmed) }))
    .filter((r) => r.score >= 0 && r.airport.code !== exclude)
    .sort((a, b) => a.score - b.score || a.airport.city.localeCompare(b.airport.city))
    .slice(0, 8)
    .map((r) => r.airport);
}

const ACCENT_STYLES = {
  indigo: {
    focusRing: "focus:border-indigo-400",
    highlight: "bg-indigo-50",
    badge: "text-indigo-700 bg-indigo-100",
  },
  emerald: {
    focusRing: "focus:border-emerald-400",
    highlight: "bg-emerald-50",
    badge: "text-emerald-700 bg-emerald-100",
  },
} as const;

export default function AirportAutocomplete({
  label,
  value,
  onChange,
  excludeCode,
  accent = "indigo",
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  excludeCode?: string;
  accent?: "indigo" | "emerald";
}) {
  const styles = ACCENT_STYLES[accent];
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = useMemo(() => {
    const selected = AIRPORTS.find((a) => a.code === value);
    return selected ? `${selected.city} (${selected.code})` : "";
  }, [value]);

  const [draftQuery, setDraftQuery] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const query = draftQuery ?? selectedLabel;

  const results = useMemo(() => searchAirports(query, excludeCode), [query, excludeCode]);
  const clampedHighlight = Math.min(highlightIndex, Math.max(results.length - 1, 0));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setDraftQuery(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectAirport(airport: Airport) {
    onChange(airport.code);
    setDraftQuery(null);
    setIsOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectAirport(results[clampedHighlight]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        value={query}
        onChange={(e) => {
          setDraftQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={(e) => {
          setIsOpen(true);
          e.target.select();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a city or airport code"
        className={`w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white/70 transition-colors focus:outline-none focus:bg-white ${styles.focusRing}`}
      />

      {isOpen && query.trim().length >= 2 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-2 w-full max-h-64 overflow-auto glass-card rounded-2xl shadow-xl animate-[fadeInUp_0.15s_ease-out] p-1.5"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-slate-400">No airports found</li>
          ) : (
            results.map((airport, i) => (
              <li
                key={airport.code}
                role="option"
                aria-selected={i === clampedHighlight}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectAirport(airport);
                }}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                  i === clampedHighlight ? styles.highlight : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {airport.city}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{airport.name}</p>
                </div>
                <span
                  className={`text-xs font-mono font-semibold rounded-full px-2 py-0.5 shrink-0 ${styles.badge}`}
                >
                  {airport.code}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
