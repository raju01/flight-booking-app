"use client";

import { useMemo } from "react";
import { generateMockFlights } from "@/lib/mockFlights";
import { formatPrice } from "@/lib/currency";
import { CabinClass } from "@/types/flight";

const SPAN_DAYS = 3;

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return {
    weekday: d.toLocaleDateString("en-IN", { weekday: "short" }),
    dayMonth: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
  };
}

export default function FareCalendar({
  from,
  to,
  date,
  cabinClass,
  onSelectDate,
}: {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
  onSelectDate: (date: string) => void;
}) {
  const days = useMemo(() => {
    const results: { date: string; price: number | null }[] = [];
    for (let offset = -SPAN_DAYS; offset <= SPAN_DAYS; offset++) {
      const d = addDays(date, offset);
      const today = new Date().toISOString().slice(0, 10);
      if (d < today) {
        results.push({ date: d, price: null });
        continue;
      }
      const flights = generateMockFlights({ from, to, date: d, cabinClass });
      const lowest = flights.length ? Math.min(...flights.map((f) => f.price)) : null;
      results.push({ date: d, price: lowest });
    }
    return results;
  }, [from, to, date, cabinClass]);

  const validPrices = days.map((d) => d.price).filter((p): p is number => p !== null);
  const cheapest = validPrices.length ? Math.min(...validPrices) : null;

  return (
    <div className="glass-card rounded-2xl p-4 mb-6">
      <p className="text-xs font-semibold text-slate-500 mb-3">
        Cheapest fares · {SPAN_DAYS} days before &amp; after your date
      </p>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map(({ date: d, price }) => {
          const isSelected = d === date;
          const isCheapest = price !== null && price === cheapest && !isSelected;
          const isDisabled = price === null;

          return (
            <button
              key={d}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(d)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-center transition-all cursor-pointer disabled:cursor-not-allowed ${
                isSelected
                  ? "bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white shadow-md shadow-violet-300"
                  : isDisabled
                    ? "bg-slate-50 text-slate-300"
                    : isCheapest
                      ? "bg-emerald-50 border-2 border-emerald-300 text-emerald-700 hover:scale-105"
                      : "bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-300 hover:scale-105"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                {weekdayLabel(d).weekday}
              </span>
              <span className="text-[10px] opacity-70">{weekdayLabel(d).dayMonth}</span>
              <span className="text-xs sm:text-sm font-extrabold">
                {price !== null ? formatPrice(price) : "—"}
              </span>
              {isCheapest && !isSelected && (
                <span className="text-[9px] font-bold uppercase tracking-wide">Lowest</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
