"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FlightCard from "@/components/FlightCard";
import { generateMockFlights } from "@/lib/mockFlights";
import { findAirport, formatAirport } from "@/lib/airports";
import { formatPrice } from "@/lib/currency";
import { timeOfDayRange, TimeOfDay } from "@/lib/timeOfDay";
import { PlaneIcon } from "@/components/icons";
import { CabinClass, Flight } from "@/types/flight";

type StopsFilter = "any" | "nonstop" | "1stop";
type TimeOfDayFilter = "any" | TimeOfDay;

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const departDate = searchParams.get("departDate") ?? "";
  const returnDate = searchParams.get("returnDate") ?? undefined;
  const passengers = Number(searchParams.get("passengers") ?? "1");
  const cabinClass = (searchParams.get("cabinClass") as CabinClass) ?? "Economy";
  const tripType = searchParams.get("tripType") ?? "one-way";

  const [sortBy, setSortBy] = useState<"price" | "duration">("price");
  const [selectedOutboundId, setSelectedOutboundId] = useState<string | null>(null);
  const [stopsFilter, setStopsFilter] = useState<StopsFilter>("any");
  const [airlineFilter, setAirlineFilter] = useState<string>("any");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<TimeOfDayFilter>("any");
  const searchKey = `${from}|${to}|${departDate}|${returnDate}|${cabinClass}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const isLoading = loadedKey !== searchKey;

  const outboundFlights = useMemo(
    () => generateMockFlights({ from, to, date: departDate, cabinClass }),
    [from, to, departDate, cabinClass]
  );

  const returnFlights = useMemo(
    () =>
      returnDate
        ? generateMockFlights({ from: to, to: from, date: returnDate, cabinClass })
        : [],
    [from, to, returnDate, cabinClass]
  );

  useEffect(() => {
    const timer = setTimeout(() => setLoadedKey(searchKey), 550);
    return () => clearTimeout(timer);
  }, [searchKey]);

  const priceCeiling = useMemo(() => {
    const all = [...outboundFlights, ...returnFlights];
    return all.length ? Math.max(...all.map((f) => f.price)) : 0;
  }, [outboundFlights, returnFlights]);

  const airlines = useMemo(() => {
    const set = new Set(outboundFlights.map((f) => f.segments[0].airline));
    return Array.from(set);
  }, [outboundFlights]);

  const sortedOutbound = useMemo(
    () =>
      sortFlights(
        filterFlights(outboundFlights, { stopsFilter, airlineFilter, maxPrice, timeOfDayFilter }),
        sortBy
      ),
    [outboundFlights, sortBy, stopsFilter, airlineFilter, maxPrice, timeOfDayFilter]
  );
  const sortedReturn = useMemo(
    () =>
      sortFlights(
        filterFlights(returnFlights, { stopsFilter, airlineFilter, maxPrice, timeOfDayFilter }),
        sortBy
      ),
    [returnFlights, sortBy, stopsFilter, airlineFilter, maxPrice, timeOfDayFilter]
  );

  const fromAirport = findAirport(from);
  const toAirport = findAirport(to);

  function handleSelect(flight: Flight, direction: "outbound" | "return") {
    const key = direction === "outbound" ? "selectedOutbound" : "selectedReturn";
    sessionStorage.setItem(key, JSON.stringify(flight));
    sessionStorage.setItem(
      "bookingMeta",
      JSON.stringify({ passengers, cabinClass, tripType })
    );

    if (tripType === "round-trip" && direction === "outbound") {
      setSelectedOutboundId(flight.id);
      return; // wait for return flight selection
    }
    router.push("/book");
  }

  function resetFilters() {
    setStopsFilter("any");
    setAirlineFilter("any");
    setMaxPrice(null);
    setTimeOfDayFilter("any");
  }

  const filtersActive =
    stopsFilter !== "any" ||
    airlineFilter !== "any" ||
    maxPrice !== null ||
    timeOfDayFilter !== "any";

  if (!fromAirport || !toAirport || !departDate) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Missing search details.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-indigo-600 font-semibold underline cursor-pointer"
        >
          Back to search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
            {formatAirport(fromAirport)}
            <PlaneIcon className="w-5 h-5 text-fuchsia-500" />
            {formatAirport(toAirport)}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {departDate}
            {returnDate ? ` – ${returnDate}` : ""} · {passengers} passenger
            {passengers > 1 ? "s" : ""} · {cabinClass}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 font-medium">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "price" | "duration")}
            className="border-2 border-slate-200 rounded-full px-3 py-1.5 bg-white cursor-pointer focus:outline-none focus:border-indigo-400"
          >
            <option value="price">Price</option>
            <option value="duration">Duration</option>
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
                  className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Stops</p>
              <div className="flex flex-col gap-1.5 text-sm">
                {(
                  [
                    ["any", "Any"],
                    ["nonstop", "Nonstop"],
                    ["1stop", "1+ stop"],
                  ] as [StopsFilter, string][]
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="stops"
                      checked={stopsFilter === value}
                      onChange={() => setStopsFilter(value)}
                      className="accent-indigo-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Airline</p>
              <select
                value={airlineFilter}
                onChange={(e) => setAirlineFilter(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-white cursor-pointer focus:outline-none focus:border-indigo-400"
              >
                <option value="any">All airlines</option>
                {airlines.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Departure time</p>
              <select
                value={timeOfDayFilter}
                onChange={(e) => setTimeOfDayFilter(e.target.value as TimeOfDayFilter)}
                className="w-full border-2 border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-white cursor-pointer focus:outline-none focus:border-indigo-400"
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
                step={100}
                value={maxPrice ?? priceCeiling}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <section className="mb-10">
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              {tripType === "round-trip" ? "Outbound flights" : "Available flights"}
            </h2>
            {selectedOutboundId && (
              <p className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-2.5 mb-3 animate-[fadeInUp_0.3s_ease-out] font-medium">
                Outbound flight selected. Now choose your return flight below.
              </p>
            )}
            <FlightList
              flights={sortedOutbound}
              isLoading={isLoading}
              selectedId={selectedOutboundId}
              onSelect={(fl) => handleSelect(fl, "outbound")}
            />
          </section>

          {tripType === "round-trip" && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Return flights</h2>
              <FlightList
                flights={sortedReturn}
                isLoading={isLoading}
                selectedId={null}
                onSelect={(fl) => handleSelect(fl, "return")}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function FlightList({
  flights,
  isLoading,
  selectedId,
  onSelect,
}: {
  flights: Flight[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (flight: Flight) => void;
}) {
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

  if (flights.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm bg-white/50">
        No flights match your filters. Try adjusting them.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {flights.map((f, i) => (
        <FlightCard
          key={f.id}
          flight={f}
          selected={f.id === selectedId}
          onSelect={onSelect}
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

function filterFlights(
  flights: Flight[],
  filters: {
    stopsFilter: StopsFilter;
    airlineFilter: string;
    maxPrice: number | null;
    timeOfDayFilter: TimeOfDayFilter;
  }
) {
  return flights.filter((f) => {
    if (filters.stopsFilter === "nonstop" && f.stops !== 0) return false;
    if (filters.stopsFilter === "1stop" && f.stops < 1) return false;
    if (filters.airlineFilter !== "any" && f.segments[0].airline !== filters.airlineFilter)
      return false;
    if (filters.maxPrice !== null && f.price > filters.maxPrice) return false;
    if (filters.timeOfDayFilter !== "any") {
      const [start, end] = timeOfDayRange(filters.timeOfDayFilter);
      const hour = new Date(f.segments[0].departureTime).getHours();
      const inRange = start < end ? hour >= start && hour < end : hour >= start || hour < end;
      if (!inRange) return false;
    }
    return true;
  });
}

function sortFlights(flights: Flight[], sortBy: "price" | "duration") {
  const copy = [...flights];
  if (sortBy === "price") return copy.sort((a, b) => a.price - b.price);
  return copy.sort(
    (a, b) => a.segments[0].durationMinutes - b.segments[0].durationMinutes
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={<div className="px-4 py-16 text-center text-slate-500">Loading…</div>}
    >
      <SearchResults />
    </Suspense>
  );
}
