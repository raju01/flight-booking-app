"use client";

import { useEffect, useRef, useState } from "react";
import { TravelerCounts, totalTravelers } from "@/types/traveler";
import { UsersIcon, ChevronIcon } from "@/components/icons";

const MAX_TOTAL = 9;
const MAX_INFANTS_PER_ADULT = 1;

const ROWS: { key: keyof TravelerCounts; label: string; hint: string; min: number }[] = [
  { key: "adults", label: "Adults", hint: "12 years and above", min: 1 },
  { key: "children", label: "Children", hint: "2-11 years", min: 0 },
  { key: "infants", label: "Infants", hint: "Under 2 years, no seat", min: 0 },
];

export default function TravelerSelector({
  value,
  onChange,
}: {
  value: TravelerCounts;
  onChange: (next: TravelerCounts) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function adjust(key: keyof TravelerCounts, delta: number) {
    const min = ROWS.find((r) => r.key === key)!.min;
    const next = { ...value, [key]: Math.max(min, value[key] + delta) };
    if (totalTravelers(next) > MAX_TOTAL) return;
    if (key === "infants" && next.infants > next.adults * MAX_INFANTS_PER_ADULT) return;
    if (key === "adults" && next.adults < Math.ceil(next.infants / MAX_INFANTS_PER_ADULT)) return;
    onChange(next);
  }

  const total = totalTravelers(value);
  const summary =
    total === 1
      ? "1 Adult"
      : [
          value.adults > 0 ? `${value.adults} Adult${value.adults > 1 ? "s" : ""}` : null,
          value.children > 0 ? `${value.children} Child${value.children > 1 ? "ren" : ""}` : null,
          value.infants > 0 ? `${value.infants} Infant${value.infants > 1 ? "s" : ""}` : null,
        ]
          .filter(Boolean)
          .join(", ");

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-slate-500 mb-1">Travelers</label>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white/70 transition-colors focus:outline-none focus:border-indigo-400 hover:bg-white cursor-pointer flex items-center justify-between gap-2"
      >
        <span className="flex items-center gap-2 text-left">
          <UsersIcon className="w-4 h-4 text-slate-400 shrink-0" />
          {summary}
        </span>
        <ChevronIcon className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-72 glass-card rounded-2xl shadow-xl p-4 animate-[fadeInUp_0.15s_ease-out]">
          {ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-slate-800">{row.label}</p>
                <p className="text-xs text-slate-400">{row.hint}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjust(row.key, -1)}
                  disabled={value[row.key] <= row.min}
                  className="w-7 h-7 rounded-full border-2 border-slate-200 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer flex items-center justify-center font-bold"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-bold text-slate-800">
                  {value[row.key]}
                </span>
                <button
                  type="button"
                  onClick={() => adjust(row.key, 1)}
                  disabled={total >= MAX_TOTAL}
                  className="w-7 h-7 rounded-full border-2 border-slate-200 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mt-3 w-full bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white text-sm font-bold rounded-full py-2 cursor-pointer"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
