"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BusCard from "@/components/BusCard";
import UnavailableNotice from "@/components/UnavailableNotice";
import DataSourceBadge from "@/components/DataSourceBadge";
import { findAirport } from "@/lib/airports";
import type { DataSource } from "@/lib/flightSearch";
import { formatPrice } from "@/lib/currency";
import { timeOfDayRange, TimeOfDay } from "@/lib/timeOfDay";
import { BusIcon } from "@/components/icons";
import { Bus, SeatType } from "@/types/bus";

type SeatTypeFilter = "any" | SeatType;
type TimeOfDayFilter = "any" | TimeOfDay;

function BusResults() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const travelDate = searchParams.get("travelDate") ?? "";
  const passengers = Number(searchParams.get("passengers") ?? "1");

  const [sortBy, setSortBy] = useState<"price" | "duration" | "rating">("price");
  const [seatTypeFilter, setSeatTypeFilter] = useState<SeatTypeFilter>("any");
  const [operatorFilter, setOperatorFilter] = useState<string>("any");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<TimeOfDayFilter>("any");
  const searchKey = `${from}|${to}|${travelDate}`;
  const [results, setResults] = useState<{
    key: string;
    buses: Bus[];
    source: DataSource;
  } | null>(null);
  const isLoading = results?.key !== searchKey;
  const buses = results?.key === searchKey ? results.buses : [];

  useEffect(() => {
    if (!from || !to || !travelDate) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ from, to, date: travelDate });
    fetch(`/api/buses?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ buses: Bus[]; source: DataSource }>;
      })
      .then((body) => setResults({ key: searchKey, buses: body.buses, source: body.source }))
      .catch(() => {});
    return () => controller.abort();
  }, [from, to, travelDate, searchKey]);

  const priceCeiling = useMemo(() => {
    const priced = buses.map((b) => b.price).filter((price): price is number => price !== null);
    return priced.length ? Math.max(...priced) : 0;
  }, [buses]);

  const operators = useMemo(() => Array.from(new Set(buses.map((b) => b.operator))), [buses]);

  const filteredBuses = useMemo(
    () =>
      sortBuses(
        filterBuses(buses, { seatTypeFilter, operatorFilter, maxPrice, timeOfDayFilter }),
        sortBy
      ),
    [buses, sortBy, seatTypeFilter, operatorFilter, maxPrice, timeOfDayFilter]
  );

  const fromAirport = findAirport(from);
  const toAirport = findAirport(to);

  function resetFilters() {
    setSeatTypeFilter("any");
    setOperatorFilter("any");
    setMaxPrice(null);
    setTimeOfDayFilter("any");
  }

  const filtersActive =
    seatTypeFilter !== "any" ||
    operatorFilter !== "any" ||
    maxPrice !== null ||
    timeOfDayFilter !== "any";

  if (!fromAirport || !toAirport || !travelDate) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Missing search details.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-emerald-600 font-semibold underline cursor-pointer"
        >
          Back to search
        </button>
      </div>
    );
  }

  const fromCity = fromAirport.city.replace(/\s*\([^)]*\)/g, "");
  const toCity = toAirport.city.replace(/\s*\([^)]*\)/g, "");

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
            {fromCity}
            <BusIcon className="w-5 h-5 text-teal-500" />
            {toCity}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {travelDate} · {passengers} passenger{passengers > 1 ? "s" : ""}
            {results?.key === searchKey && (
              <span className="ml-2 align-middle">
                <DataSourceBadge source={results.source} liveLabel="Live buses" />
              </span>
            )}
          </p>
          {results?.key === searchKey && results.source === "live" && (
            <p className="text-xs text-slate-500 mt-1">
              Times are from Google. A fare is shown when Google publishes one; otherwise check redBus.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 font-medium">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "price" | "duration" | "rating")}
            className="border-2 border-slate-200 rounded-full px-3 py-1.5 bg-white cursor-pointer focus:outline-none focus:border-emerald-400"
          >
            <option value="price">Price</option>
            <option value="duration">Duration</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <aside className="sm:w-60 shrink-0">
          <div className="glass-card rounded-2xl p-4 sm:sticky sm:top-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900">Filters</h3>
              {filtersActive && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-emerald-600 font-semibold hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Seat type</p>
              <div className="flex flex-col gap-1.5 text-sm">
                {(
                  [
                    ["any", "Any"],
                    ["Seater", "Seater"],
                    ["Sleeper", "Sleeper"],
                    ["AC Semi-Sleeper", "AC Semi-Sleeper"],
                    ["AC Sleeper", "AC Sleeper"],
                  ] as [SeatTypeFilter, string][]
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="seatType"
                      checked={seatTypeFilter === value}
                      onChange={() => setSeatTypeFilter(value)}
                      className="accent-emerald-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Operator</p>
              <select
                value={operatorFilter}
                onChange={(e) => setOperatorFilter(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-400"
              >
                <option value="any">All operators</option>
                {operators.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Departure time</p>
              <select
                value={timeOfDayFilter}
                onChange={(e) => setTimeOfDayFilter(e.target.value as TimeOfDayFilter)}
                className="w-full border-2 border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-400"
              >
                <option value="any">Any time</option>
                <option value="morning">Morning (5am–12pm)</option>
                <option value="afternoon">Afternoon (12pm–5pm)</option>
                <option value="evening">Evening (5pm–9pm)</option>
                <option value="night">Night (9pm–5am)</option>
              </select>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Max price {maxPrice !== null ? `· ${formatPrice(maxPrice)}` : ""}
              </p>
              <input
                type="range"
                min={0}
                max={priceCeiling || 1}
                step={50}
                value={maxPrice ?? priceCeiling}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <BusList
            buses={filteredBuses}
            isLoading={isLoading}
            unavailable={results?.key === searchKey && results.source === "unavailable"}
          />
        </div>
      </div>
    </div>
  );
}

function BusList({
  buses,
  isLoading,
  unavailable = false,
}: {
  buses: Bus[];
  isLoading: boolean;
  unavailable?: boolean;
}) {
  if (unavailable) return <UnavailableNotice what="bus times" />;
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="relative h-24 rounded-2xl bg-slate-100 overflow-hidden"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="shimmer absolute inset-0" />
          </div>
        ))}
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm bg-white/50">
        No buses match your filters. Try adjusting them.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {buses.map((b, i) => (
        <BusCard key={b.id} bus={b} style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}

function filterBuses(
  buses: Bus[],
  filters: {
    seatTypeFilter: SeatTypeFilter;
    operatorFilter: string;
    maxPrice: number | null;
    timeOfDayFilter: TimeOfDayFilter;
  }
) {
  return buses.filter((b) => {
    if (filters.seatTypeFilter !== "any" && b.seatType !== filters.seatTypeFilter) return false;
    if (filters.operatorFilter !== "any" && b.operator !== filters.operatorFilter) return false;
    if (filters.maxPrice !== null && (b.price === null || b.price > filters.maxPrice)) return false;
    if (filters.timeOfDayFilter !== "any") {
      const [start, end] = timeOfDayRange(filters.timeOfDayFilter);
      const hour = new Date(b.departureTime).getHours();
      const inRange = start < end ? hour >= start && hour < end : hour >= start || hour < end;
      if (!inRange) return false;
    }
    return true;
  });
}

function sortBuses(buses: Bus[], sortBy: "price" | "duration" | "rating") {
  const copy = [...buses];
  if (sortBy === "price") {
    return copy.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
  }
  if (sortBy === "rating") return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return copy.sort((a, b) => a.durationMinutes - b.durationMinutes);
}

export default function BusSearchPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-slate-500">Loading…</div>}>
      <BusResults />
    </Suspense>
  );
}
