"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CalendarIcon, ChevronIcon } from "@/components/icons";
import { addDays, futureDate, parseISODate, toISODate } from "@/lib/dates";

const ACCENTS = {
  indigo: {
    selected: "bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white shadow-md shadow-violet-300/60",
    range: "bg-indigo-50 text-indigo-900",
    today: "ring-1 ring-indigo-300",
    focusBorder: "focus:border-indigo-400",
    open: "border-indigo-400",
    chip: "hover:border-indigo-300 hover:text-indigo-700",
    ring: "focus-visible:ring-indigo-400",
  },
  emerald: {
    selected: "bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-300/60",
    range: "bg-emerald-50 text-emerald-900",
    today: "ring-1 ring-emerald-300",
    focusBorder: "focus:border-emerald-400",
    open: "border-emerald-400",
    chip: "hover:border-emerald-300 hover:text-emerald-700",
    ring: "focus-visible:ring-emerald-400",
  },
} as const;

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const subscribeWide = (callback: () => void) => {
  const query = window.matchMedia("(min-width: 640px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};

function formatLong(iso: string): string {
  const date = parseISODate(iso);
  return date
    ? date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : iso;
}

function formatShort(iso: string): string {
  const date = parseISODate(iso);
  return date
    ? date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : "";
}

interface Month {
  year: number;
  month: number; // 0-11
}

function shiftMonth({ year, month }: Month, by: number): Month {
  const date = new Date(year, month + by, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function monthOf(iso: string): Month {
  const date = parseISODate(iso) ?? new Date();
  return { year: date.getFullYear(), month: date.getMonth() };
}

function clamp(iso: string, min?: string, max?: string): string {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

interface CalendarProps {
  value: string;
  min?: string;
  max?: string;
  rangeStart?: string;
  rangeEnd?: string;
  accent: keyof typeof ACCENTS;
  onPick: (iso: string) => void;
  onClose: () => void;
}

// Mounted only while open, so it starts on the chosen month each time without any effects.
function Calendar({ value, min, max, rangeStart, rangeEnd, accent, onPick, onClose }: CalendarProps) {
  const style = ACCENTS[accent];
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia("(min-width: 640px)").matches, () => false);
  const today = futureDate(0);
  const start = clamp(value || today, min, max);
  const [visible, setVisible] = useState<Month>(() => monthOf(start));
  const [focusIso, setFocusIso] = useState(start);
  const rootRef = useRef<HTMLDivElement>(null);
  const months = wide ? [visible, shiftMonth(visible, 1)] : [visible];

  useEffect(() => {
    rootRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusIso}"]`)?.focus();
  }, [focusIso, visible, wide]);

  const canGoBack = !min || toISODate(new Date(visible.year, visible.month, 0)) >= min;
  const canGoForward = !max || toISODate(new Date(shiftMonth(visible, months.length).year, shiftMonth(visible, months.length).month, 1)) <= max;

  function moveFocus(iso: string) {
    const next = clamp(iso, min, max);
    const target = monthOf(next);
    const first = months[0];
    const last = months[months.length - 1];
    const before = target.year * 12 + target.month < first.year * 12 + first.month;
    const after = target.year * 12 + target.month > last.year * 12 + last.month;
    if (before) setVisible(target);
    else if (after) setVisible(shiftMonth(target, -(months.length - 1)));
    setFocusIso(next);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const date = parseISODate(focusIso);
    if (!date) return;
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focusIso, -1),
      ArrowRight: () => addDays(focusIso, 1),
      ArrowUp: () => addDays(focusIso, -7),
      ArrowDown: () => addDays(focusIso, 7),
      PageUp: () => toISODate(new Date(date.getFullYear(), date.getMonth() - 1, date.getDate())),
      PageDown: () => toISODate(new Date(date.getFullYear(), date.getMonth() + 1, date.getDate())),
    };
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (moves[e.key]) {
      e.preventDefault();
      moveFocus(moves[e.key]());
    }
  }

  const quick = [
    ["Tomorrow", addDays(today, 1)],
    ["This weekend", addDays(today, (6 - (parseISODate(today)?.getDay() ?? 0) + 7) % 7 || 7)],
    ["Next week", addDays(today, 7)],
    ["In a month", addDays(today, 30)],
  ].filter(([, iso]) => (!min || iso >= min) && (!max || iso <= max));

  return (
    <div ref={rootRef} onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setVisible(shiftMonth(visible, -1))}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronIcon className="w-4 h-4 rotate-90" />
        </button>
        <div className="flex-1 flex justify-around text-sm font-bold text-slate-900" aria-live="polite">
          {months.map((m) => (
            <span key={`${m.year}-${m.month}`}>
              {new Date(m.year, m.month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setVisible(shiftMonth(visible, 1))}
          disabled={!canGoForward}
          aria-label="Next month"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronIcon className="w-4 h-4 -rotate-90" />
        </button>
      </div>

      <div className={`grid gap-6 ${wide ? "grid-cols-2" : "grid-cols-1"}`}>
        {months.map(({ year, month }) => {
          const blanks = new Date(year, month, 1).getDay();
          const count = new Date(year, month + 1, 0).getDate();
          return (
            <div key={`${year}-${month}`}>
              <div className="grid grid-cols-7 mb-1" aria-hidden>
                {WEEKDAYS.map((d, i) => (
                  <span key={i} className="text-center text-[11px] font-semibold text-slate-500 py-1">
                    {d}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: blanks }, (_, i) => (
                  <span key={`b${i}`} />
                ))}
                {Array.from({ length: count }, (_, i) => {
                  const iso = toISODate(new Date(year, month, i + 1));
                  const disabled = Boolean((min && iso < min) || (max && iso > max));
                  const selected = iso === value;
                  const inRange = Boolean(rangeStart && rangeEnd && iso > rangeStart && iso < rangeEnd);
                  const isEdge = Boolean(rangeStart && rangeEnd && (iso === rangeStart || iso === rangeEnd));
                  return (
                    <button
                      key={iso}
                      type="button"
                      data-date={iso}
                      disabled={disabled}
                      tabIndex={iso === focusIso ? 0 : -1}
                      aria-label={formatLong(iso)}
                      aria-pressed={selected}
                      onClick={() => onPick(iso)}
                      className={`h-10 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 ${style.ring} ${
                        selected
                          ? `rounded-xl ${style.selected}`
                          : isEdge
                            ? `rounded-xl ${style.range} font-bold`
                            : inRange
                              ? `${style.range} rounded-none`
                              : disabled
                                ? "rounded-xl text-slate-300 cursor-not-allowed"
                                : "rounded-xl text-slate-800 hover:bg-slate-100 cursor-pointer"
                      } ${iso === today && !selected ? `rounded-xl ${style.today}` : ""}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {quick.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
          {quick.map(([label, iso]) => (
            <button
              key={label}
              type="button"
              onClick={() => onPick(iso)}
              className={`rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors cursor-pointer ${style.chip}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export interface DatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ariaLabel: string;
  min?: string;
  max?: string;
  rangeStart?: string;
  rangeEnd?: string;
  accent?: keyof typeof ACCENTS;
  align?: "left" | "right";
}

export default function DatePicker({
  value,
  onChange,
  open,
  onOpenChange,
  ariaLabel,
  min,
  max,
  rangeStart,
  rangeEnd,
  accent = "indigo",
  align = "left",
}: DatePickerProps) {
  const style = ACCENTS[accent];
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onOpenChange(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open, onOpenChange]);

  function close() {
    onOpenChange(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${ariaLabel}: ${value ? formatLong(value) : "not chosen"}`}
        onClick={() => onOpenChange(!open)}
        className={`w-full flex items-center gap-2 border-2 rounded-2xl px-4 py-2.5 bg-white text-left text-slate-900 transition-colors focus:outline-none cursor-pointer ${
          open ? style.open : "border-slate-200"
        } ${style.focusBorder}`}
      >
        <CalendarIcon className="w-4 h-4 text-slate-500 shrink-0" />
        <span className={value ? "" : "text-slate-500"}>{value ? formatShort(value) : "Select date"}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className={`absolute z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] sm:w-[40rem] bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/15 p-4 animate-[fadeInUp_0.15s_ease-out] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <Calendar
            value={value}
            min={min}
            max={max}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            accent={accent}
            onPick={(iso) => onChange(iso)}
            onClose={close}
          />
        </div>
      )}
    </div>
  );
}
