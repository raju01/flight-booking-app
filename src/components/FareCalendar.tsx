"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchFareCalendar } from "@/lib/liveApi";
import { formatPrice } from "@/lib/currency";
import { addDays, futureDate, parseISODate } from "@/lib/dates";
import { CabinClass } from "@/types/flight";
import { TravelerCounts } from "@/types/traveler";

const SPAN_DAYS = 3;

function weekdayLabel(iso: string) {
  const d = parseISODate(iso) ?? new Date();
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
  travelers,
  onSelectDate,
}: {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
  travelers: TravelerCounts;
  onSelectDate: (date: string, prices: { selected: number | null; chosen: number | null }) => void;
}) {
  const dates = useMemo(
    () => Array.from({ length: SPAN_DAYS * 2 + 1 }, (_, i) => addDays(date, i - SPAN_DAYS)),
    [date]
  );
  const { adults, children, infants } = travelers;
  const calendarKey = `${from}|${to}|${date}|${cabinClass}|${adults}-${children}-${infants}`;
  // The key of the search the visitor asked live nearby-date fares for (it costs a few lookups).
  const [requestedKey, setRequestedKey] = useState<string | null>(null);
  const requested = requestedKey === calendarKey;
  const [loaded, setLoaded] = useState<{ key: string; prices: Map<string, number | null> } | null>(
    null
  );

  useEffect(() => {
    if (date < futureDate(0)) return; // nothing to compare for a day that has passed
    const controller = new AbortController();
    fetchFareCalendar(
      { from, to, date, cabinClass, passengers: adults + children, travelers: { adults, children, infants }, load: requested },
      controller.signal
    )
      .then((result) => {
        const prices = new Map((result?.days ?? []).map((d) => [d.date, d.price]));
        setLoaded({ key: calendarKey, prices });
      })
      .catch(() => {}); // aborted by a newer search
    return () => controller.abort();
  }, [from, to, date, cabinClass, adults, children, infants, calendarKey, requested]);

  // undefined while the prices for this search are still loading
  const days: { date: string; price: number | null | undefined }[] = dates.map((d) => ({
    date: d,
    price: loaded?.key === calendarKey ? (loaded.prices.get(d) ?? null) : undefined,
  }));

  const validPrices = days.map((d) => d.price).filter((p): p is number => typeof p === "number");
  const cheapest = validPrices.length ? Math.min(...validPrices) : null;

  const nothingLoaded = loaded?.key === calendarKey && loaded.prices.size === 0;
  if (nothingLoaded && !requested) {
    // Live fares for each nearby date are separate lookups, so they load on request.
    return (
      <div className="glass-card rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Flexible on dates? Compare fares {SPAN_DAYS} days either side.</p>
        <button
          type="button"
          onClick={() => setRequestedKey(calendarKey)}
          className="rounded-full border-2 border-indigo-200 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 cursor-pointer"
        >
          Compare nearby dates
        </button>
      </div>
    );
  }
  if (nothingLoaded && requested) {
    return (
      <div className="glass-card rounded-2xl p-4 mb-6 text-sm text-slate-600">
        Fares for nearby dates are unavailable right now.
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4 mb-6">
      <p className="text-xs font-semibold text-slate-500 mb-3">
        Cheapest fares · {SPAN_DAYS} days before &amp; after your date
      </p>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map(({ date: d, price }) => {
          const isSelected = d === date;
          const isCheapest = typeof price === "number" && price === cheapest && !isSelected;
          // Only checked once prices have loaded (in the browser), so server and browser markup match.
          const isPast = loaded !== null && d < futureDate(0);
          const isDisabled = price === null || isPast;

          return (
            <button
              key={d}
              type="button"
              disabled={isDisabled}
              onClick={() =>
                !isSelected &&
                onSelectDate(d, {
                  selected: days.find((x) => x.date === date)?.price ?? null,
                  chosen: typeof price === "number" ? price : null,
                })
              }
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
                {price === undefined ? "…" : price !== null ? formatPrice(price) : "—"}
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
