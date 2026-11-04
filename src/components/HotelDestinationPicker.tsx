"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { HOTEL_DESTINATIONS, HotelDestination, POPULAR_HOTEL_DESTINATIONS } from "@/lib/hotelCities";

const MAX_RESULTS = 12;

function score(d: HotelDestination, q: string): number {
  const name = d.name.toLowerCase();
  const region = d.region.toLowerCase();
  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (name.split(/[\s-]/).some((w) => w.startsWith(q))) return 2;
  if (name.includes(q)) return 3;
  if (region.startsWith(q)) return 4; // e.g. "kerala" lists Kerala's places
  return -1;
}

// Destination box for hotels: popular places as soon as it opens, every listed town as you type
// (Indian places first), and any other place name can be searched as typed.
export default function HotelDestinationPicker({ value, onChange }: { value: string; onChange: (place: string) => void }) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const query = draft ?? value;

  const typed = (draft ?? "").trim().toLowerCase();
  const results = useMemo(() => {
    if (typed.length < 1) return POPULAR_HOTEL_DESTINATIONS.slice(0, MAX_RESULTS);
    return HOTEL_DESTINATIONS.map((d) => ({ d, s: score(d, typed) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => a.s - b.s || Number(b.d.india) - Number(a.d.india) || a.d.name.localeCompare(b.d.name))
      .slice(0, MAX_RESULTS)
      .map((r) => r.d);
  }, [typed]);
  const freeText = (draft ?? "").trim();
  const offerFreeText = freeText.length >= 2 && !results.some((d) => d.name.toLowerCase() === freeText.toLowerCase());
  const optionCount = results.length + (offerFreeText ? 1 : 0);
  const active = Math.min(highlight, Math.max(optionCount - 1, 0));

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setDraft(null);
      }
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  function choose(place: string) {
    onChange(place);
    setDraft(null);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || optionCount === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, optionCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active < results.length ? results[active].name : freeText);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={`${listId}-input`} className="block text-xs font-semibold text-slate-500 mb-1">
        City, town or area
      </label>
      <input
        id={`${listId}-input`}
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={query}
        onChange={(e) => {
          setDraft(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={(e) => {
          setOpen(true);
          setDraft("");
          e.target.select();
        }}
        onKeyDown={onKeyDown}
        placeholder="e.g. Manali, Goa, Munnar, Rishikesh"
        className="w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 caret-slate-900 transition-colors focus:outline-none focus:border-amber-400"
      />
      {open && optionCount > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-xl"
        >
          {typed.length < 1 && (
            <li className="px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Popular in India</li>
          )}
          {results.map((d, i) => (
            <li
              key={`${d.name}-${d.region}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(d.name)}
              onMouseEnter={() => setHighlight(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 ${i === active ? "bg-amber-50" : ""}`}
            >
              <span className="font-semibold text-slate-800">{d.name}</span>
              <span className="truncate text-xs text-slate-500">{d.india ? d.region || "India" : d.region}</span>
            </li>
          ))}
          {offerFreeText && (
            <li
              role="option"
              aria-selected={active === results.length}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(freeText)}
              onMouseEnter={() => setHighlight(results.length)}
              className={`cursor-pointer border-t border-slate-100 px-4 py-2 text-sm text-amber-800 ${active === results.length ? "bg-amber-50" : ""}`}
            >
              Search hotels in &ldquo;<strong>{freeText}</strong>&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
