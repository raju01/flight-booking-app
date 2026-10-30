"use client";

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FlightCard from "@/components/FlightCard";

// Seller prices cost one SerpApi credit per flight, so only the top results load them automatically.
const AUTO_COMPARE_COUNT = 3;
import FareCalendar from "@/components/FareCalendar";
import NearbyAirportSuggestion from "@/components/NearbyAirportSuggestion";
import DataSourceBadge from "@/components/DataSourceBadge";
import { DataSource, fetchFlights } from "@/lib/liveApi";
import { lowestEmissionsId } from "@/lib/emissions";
import { layoverMinutes } from "@/lib/layover";
import { totalDurationMinutes } from "@/lib/flightDuration";
import { addDays, futureDate } from "@/lib/dates";
import { addFareAlert, findFareAlert, removeFareAlert } from "@/lib/fareAlerts";
import { BellIcon } from "@/components/icons";
import { findAirport, formatAirport } from "@/lib/airports";
import { formatPrice } from "@/lib/currency";
import { timeOfDayRange, TimeOfDay } from "@/lib/timeOfDay";
import { PlaneIcon } from "@/components/icons";
import PriceInsightBanner from "@/components/PriceInsightBanner";
import SortTabs, { SortSummary } from "@/components/SortTabs";
import DateChangeDialog, { DateChange } from "@/components/DateChangeDialog";
import { CabinClass, Flight, PriceInsights } from "@/types/flight";
import { MultiCityLeg } from "@/types/multiCity";
import { TravelerCounts, totalTravelers } from "@/types/traveler";

const NO_FLIGHTS: Flight[] = [];

type StopsFilter = "any" | "nonstop" | "1stop";
type TimeOfDayFilter = "any" | TimeOfDay;
type LayoverFilter = "any" | "short" | "medium" | "long";
type SortBy = "best" | "price" | "duration" | "departure" | "latest" | "stops";

const SORT_OPTIONS: [SortBy, string][] = [
  ["best", "Best"],
  ["price", "Cheapest"],
  ["duration", "Fastest"],
  ["departure", "Earliest departure"],
  ["latest", "Latest departure"],
  ["stops", "Fewest stops"],
];

function formatTravelerSummary(travelers: TravelerCounts): string {
  const total = totalTravelers(travelers);
  const extras = [
    travelers.children > 0 ? `${travelers.children} child${travelers.children > 1 ? "ren" : ""}` : null,
    travelers.infants > 0 ? `${travelers.infants} infant${travelers.infants > 1 ? "s" : ""}` : null,
  ].filter(Boolean);
  const base = `${total} passenger${total > 1 ? "s" : ""}`;
  return extras.length > 0 ? `${base} (${extras.join(", ")})` : base;
}

function readTravelerCounts(searchParams: URLSearchParams): TravelerCounts {
  const adults = Number(searchParams.get("adults") ?? searchParams.get("passengers") ?? "1");
  const children = Number(searchParams.get("children") ?? "0");
  const infants = Number(searchParams.get("infants") ?? "0");
  return {
    adults: Number.isFinite(adults) && adults > 0 ? adults : 1,
    children: Number.isFinite(children) && children > 0 ? children : 0,
    infants: Number.isFinite(infants) && infants > 0 ? infants : 0,
  };
}

const subscribeNever = () => () => {};

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const departDate = searchParams.get("departDate") ?? "";
  const returnDate = searchParams.get("returnDate") ?? undefined;
  const travelers = readTravelerCounts(searchParams);
  const cabinClass = (searchParams.get("cabinClass") as CabinClass) ?? "Economy";
  const tripType = searchParams.get("tripType") ?? "one-way";

  const [sortBy, setSortBy] = useState<SortBy>("best");
  const [stopsFilter, setStopsFilter] = useState<StopsFilter>("any");
  const [airlineFilter, setAirlineFilter] = useState<string>("any");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<TimeOfDayFilter>("any");
  const [layoverFilter, setLayoverFilter] = useState<LayoverFilter>("any");
  const { adults, children, infants } = travelers;
  const searchKey = `${from}|${to}|${departDate}|${returnDate}|${cabinClass}|${adults}-${children}-${infants}`;
  const [results, setResults] = useState<{
    key: string;
    outbound: Flight[];
    returns: Flight[];
    source: DataSource;
    insights?: PriceInsights;
  } | null>(null);
  const isLoading = results?.key !== searchKey;
  const [alertSaved, setAlertSaved] = useState(false);

  useEffect(() => {
    if (!from || !to || !departDate) return;
    // Reads localStorage (unavailable during SSR) after mount to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlertSaved(Boolean(findFareAlert(from, to, departDate, cabinClass)));
  }, [from, to, departDate, cabinClass]);

  useEffect(() => {
    if (!from || !to || !departDate) return;
    if (departDate < futureDate(0)) return; // flights are sold for today and later only
    const controller = new AbortController();
    const base = { cabinClass, passengers: adults + children, travelers: { adults, children, infants } };
    Promise.all([
      fetchFlights({ ...base, from, to, date: departDate }, controller.signal),
      returnDate
        ? fetchFlights({ ...base, from: to, to: from, date: returnDate }, controller.signal)
        : null,
    ])
      .then(([outbound, ret]) =>
        setResults({
          key: searchKey,
          outbound: outbound.flights,
          returns: ret?.flights ?? NO_FLIGHTS,
          source: outbound.source,
          insights: outbound.insights,
        })
      )
      .catch(() => {}); // aborted by a newer search
    return () => controller.abort();
  }, [from, to, departDate, returnDate, cabinClass, adults, children, infants, searchKey]);

  const outboundFlights = results?.key === searchKey ? results.outbound : NO_FLIGHTS;
  const returnFlights = results?.key === searchKey ? results.returns : NO_FLIGHTS;

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
        filterFlights(outboundFlights, {
          stopsFilter,
          airlineFilter,
          maxPrice,
          timeOfDayFilter,
          layoverFilter,
        }),
        sortBy
      ),
    [outboundFlights, sortBy, stopsFilter, airlineFilter, maxPrice, timeOfDayFilter, layoverFilter]
  );
  const sortedReturn = useMemo(
    () =>
      sortFlights(
        filterFlights(returnFlights, {
          stopsFilter,
          airlineFilter,
          maxPrice,
          timeOfDayFilter,
          layoverFilter,
        }),
        sortBy
      ),
    [returnFlights, sortBy, stopsFilter, airlineFilter, maxPrice, timeOfDayFilter, layoverFilter]
  );

  const sortSummary = useMemo<SortSummary | null>(() => {
    const filtered = filterFlights(outboundFlights, {
      stopsFilter,
      airlineFilter,
      maxPrice,
      timeOfDayFilter,
      layoverFilter,
    });
    if (filtered.length === 0) return null;
    const describe = (f: Flight) => ({ price: f.price, minutes: totalDurationMinutes(f) });
    return {
      best: describe(sortFlights(filtered, "best")[0]),
      price: describe(sortFlights(filtered, "price")[0]),
      duration: describe(sortFlights(filtered, "duration")[0]),
    };
  }, [outboundFlights, stopsFilter, airlineFilter, maxPrice, timeOfDayFilter, layoverFilter]);

  const fromAirport = findAirport(from);
  const toAirport = findAirport(to);

  // A different travel date is a different search, so the visitor confirms it first.
  const [pendingChange, setPendingChange] = useState<DateChange | null>(null);
  // Empty on the server and first render so the page hydrates cleanly; set by the browser after that.
  const today = useSyncExternalStore(subscribeNever, () => futureDate(0), () => "");
  const datePassed = Boolean(today && departDate && (departDate < today || (returnDate && returnDate < today)));

  function askToChangeDate(
    field: "departDate" | "returnDate",
    newDate: string,
    prices: { selected: number | null; chosen: number | null }
  ) {
    setPendingChange({
      field,
      from: field === "departDate" ? departDate : (returnDate ?? departDate),
      to: newDate,
      fromPrice: prices.selected,
      toPrice: prices.chosen,
    });
  }

  function handleSelectDate(field: "departDate" | "returnDate", newDate: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(field, newDate);
    // A return flight cannot leave before the outbound one.
    if (field === "departDate" && returnDate && newDate > returnDate) params.set("returnDate", newDate);
    router.push(`/search?${params.toString()}`);
  }

  function toggleFareAlert() {
    if (alertSaved) {
      removeFareAlert(`${from}-${to}-${departDate}-${cabinClass}`);
      setAlertSaved(false);
      return;
    }
    const lowest = outboundFlights.length ? Math.min(...outboundFlights.map((f) => f.price)) : 0;
    addFareAlert(from, to, departDate, cabinClass, lowest);
    setAlertSaved(true);
  }

  function resetFilters() {
    setStopsFilter("any");
    setAirlineFilter("any");
    setMaxPrice(null);
    setTimeOfDayFilter("any");
    setLayoverFilter("any");
  }

  const filtersActive =
    stopsFilter !== "any" ||
    airlineFilter !== "any" ||
    maxPrice !== null ||
    timeOfDayFilter !== "any" ||
    layoverFilter !== "any";

  if (datePassed) {
    // Today is the earliest date anyone can fly, so offer that instead of showing fares for a day that is gone.
    const params = new URLSearchParams(searchParams.toString());
    params.set("departDate", today);
    if (returnDate) params.set("returnDate", returnDate < today ? addDays(today, 7) : returnDate);
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
          Date has passed
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
          {departDate < today ? departDate : returnDate} is in the past
        </h1>
        <p className="mt-2 text-slate-600">
          Flights can be booked for today and later only. Search from today instead, or pick another date.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/search?${params.toString()}`)}
            className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-6 py-3 font-bold text-white cursor-pointer"
          >
            Search from today
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border-2 border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 cursor-pointer"
          >
            Choose another date
          </button>
        </div>
      </div>
    );
  }

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
            {returnDate ? ` – ${returnDate}` : ""} · {formatTravelerSummary(travelers)} ·{" "}
            {cabinClass}
            {" · "}Prices compared across sellers
            {results?.key === searchKey && (
              <span className="ml-2 align-middle">
                <DataSourceBadge source={results.source} />
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="border-2 border-slate-200 rounded-full px-3 py-1.5 bg-white text-slate-800 cursor-pointer focus:outline-none focus:border-indigo-400"
            >
              {SORT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={toggleFareAlert}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition-all cursor-pointer ${
              alertSaved
                ? "bg-amber-100 text-amber-700"
                : "border-2 border-slate-200 bg-white text-slate-600 hover:border-amber-300"
            }`}
          >
            <BellIcon className="w-4 h-4" filled={alertSaved} />
            {alertSaved ? "Alert set" : "Set price alert"}
          </button>
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

            {stopsFilter !== "nonstop" && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">Layover duration</p>
                <select
                  value={layoverFilter}
                  onChange={(e) => setLayoverFilter(e.target.value as LayoverFilter)}
                  className="w-full border-2 border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-white cursor-pointer focus:outline-none focus:border-indigo-400"
                >
                  <option value="any">Any layover</option>
                  <option value="short">Under 2h</option>
                  <option value="medium">2h – 4h</option>
                  <option value="long">4h+</option>
                </select>
              </div>
            )}

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
          {tripType !== "multi-city" && results?.key === searchKey && results.source === "mock" && (
            <NearbyAirportSuggestion
              from={from}
              to={to}
              date={departDate}
              cabinClass={cabinClass}
              currentLowestPrice={
                outboundFlights.length ? Math.min(...outboundFlights.map((f) => f.price)) : null
              }
            />
          )}
          {results?.key === searchKey && results.insights && outboundFlights.length > 0 && (
            <PriceInsightBanner
              insights={results.insights}
              party={travelers}
              travelDate={departDate}
              lowestPrice={Math.min(...outboundFlights.map((f) => f.price))}
            />
          )}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              {tripType === "round-trip" ? "Outbound flights" : "Available flights"}
            </h2>
            <FareCalendar
              from={from}
              to={to}
              date={departDate}
              cabinClass={cabinClass}
              travelers={travelers}
              onSelectDate={(d, prices) => askToChangeDate("departDate", d, prices)}
            />
            {sortSummary && !isLoading && (
              <SortTabs value={sortBy} onChange={setSortBy} summary={sortSummary} />
            )}
            <FlightList flights={sortedOutbound} isLoading={isLoading} filtersActive={filtersActive} />
          </section>

          {tripType === "round-trip" && returnDate && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Return flights</h2>
              <FareCalendar
                from={to}
                to={from}
                date={returnDate}
                cabinClass={cabinClass}
                travelers={travelers}
                onSelectDate={(d, prices) => askToChangeDate("returnDate", d, prices)}
              />
              <FlightList flights={sortedReturn} isLoading={isLoading} filtersActive={filtersActive} />
            </section>
          )}
        </div>
      </div>
      {pendingChange && (
        <DateChangeDialog
          change={pendingChange}
          onCancel={() => setPendingChange(null)}
          onConfirm={() => {
            const { field, to } = pendingChange;
            setPendingChange(null);
            handleSelectDate(field, to);
          }}
        />
      )}
    </div>
  );
}

function MultiCityResults() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const legsParam = searchParams.get("legs") ?? "[]";
  const travelers = readTravelerCounts(searchParams);
  const cabinClass = (searchParams.get("cabinClass") as CabinClass) ?? "Economy";

  const legs: MultiCityLeg[] = useMemo(() => {
    try {
      const parsed = JSON.parse(legsParam);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [legsParam]);

  const { adults, children, infants } = travelers;
  const searchKey = `${legsParam}|${cabinClass}|${adults}-${children}-${infants}`;
  const [legResults, setLegResults] = useState<{
    key: string;
    flights: Flight[][];
    source: DataSource;
  } | null>(null);
  const isLoading = legResults?.key !== searchKey;

  useEffect(() => {
    if (legs.length === 0) return;
    const controller = new AbortController();
    Promise.all(
      legs.map((leg) =>
        fetchFlights(
          {
            from: leg.from,
            to: leg.to,
            date: leg.date,
            cabinClass,
            passengers: adults + children,
            travelers: { adults, children, infants },
          },
          controller.signal
        )
      )
    )
      .then((all) =>
        setLegResults({
          key: searchKey,
          flights: all.map((r) => r.flights),
          source: all.every((r) => r.source === "live") ? "live" : "mock",
        })
      )
      .catch(() => {}); // aborted by a newer search
    return () => controller.abort();
  }, [legs, cabinClass, adults, children, infants, searchKey]);

  const legFlights = legResults?.key === searchKey ? legResults.flights : legs.map(() => NO_FLIGHTS);

  if (legs.length === 0) {
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
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 flex-wrap mb-1">
        Multi-city trip
        <PlaneIcon className="w-5 h-5 text-fuchsia-500" />
        {legResults?.key === searchKey && <DataSourceBadge source={legResults.source} />}
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        {legs.length} flights · {formatTravelerSummary(travelers)} · {cabinClass} · Book each
        flight on MakeMyTrip
      </p>

      <div className="flex flex-col gap-10">
        {legs.map((leg, i) => {
          const fromAirport = findAirport(leg.from);
          const toAirport = findAirport(leg.to);

          return (
            <section key={i}>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white">
                  {i + 1}
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  {fromAirport ? formatAirport(fromAirport) : leg.from} →{" "}
                  {toAirport ? formatAirport(toAirport) : leg.to}
                </h2>
                <span className="text-sm text-slate-500">{leg.date}</span>
              </div>

              <FlightList flights={legFlights[i]} isLoading={isLoading} />
            </section>
          );
        })}
      </div>
    </div>
  );
}

function FlightList({
  flights,
  isLoading,
  filtersActive = true,
}: {
  flights: Flight[];
  isLoading: boolean;
  filtersActive?: boolean;
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
        {filtersActive
          ? "No flights match your filters. Try adjusting them."
          : "No flights found for this date. Try another date, or check nearby airports."}
      </div>
    );
  }

  const greenestId = lowestEmissionsId(flights);

  return (
    <div className="flex flex-col gap-3">
      {flights.map((f, i) => (
        <FlightCard
          key={f.id}
          flight={f}
          isGreenest={f.id === greenestId}
          autoCompare={i < AUTO_COMPARE_COUNT}
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
    layoverFilter?: LayoverFilter;
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
    if (filters.layoverFilter && filters.layoverFilter !== "any") {
      const minutes = layoverMinutes(f);
      if (minutes === null) return false;
      if (filters.layoverFilter === "short" && minutes >= 120) return false;
      if (filters.layoverFilter === "medium" && (minutes < 120 || minutes >= 240)) return false;
      if (filters.layoverFilter === "long" && minutes < 240) return false;
    }
    return true;
  });
}

function bestScore(flight: Flight, priceRange: [number, number], durationRange: [number, number]) {
  const [minPrice, maxPrice] = priceRange;
  const [minDuration, maxDuration] = durationRange;
  const priceScore = maxPrice > minPrice ? (flight.price - minPrice) / (maxPrice - minPrice) : 0;
  const durationScore =
    maxDuration > minDuration
      ? (totalDurationMinutes(flight) - minDuration) / (maxDuration - minDuration)
      : 0;
  const stopsScore = flight.stops > 0 ? 1 : 0;
  return priceScore * 0.5 + durationScore * 0.35 + stopsScore * 0.15;
}

function sortFlights(flights: Flight[], sortBy: SortBy) {
  const copy = [...flights];
  if (sortBy === "price") return copy.sort((a, b) => a.price - b.price);
  if (sortBy === "duration") {
    return copy.sort((a, b) => totalDurationMinutes(a) - totalDurationMinutes(b));
  }
  // Departure times are local wall-clock ISO strings for the same day, so they sort as text.
  const departure = (f: Flight) => f.segments[0].departureTime;
  if (sortBy === "departure") return copy.sort((a, b) => departure(a).localeCompare(departure(b)));
  if (sortBy === "latest") return copy.sort((a, b) => departure(b).localeCompare(departure(a)));
  if (sortBy === "stops") return copy.sort((a, b) => a.stops - b.stops || a.price - b.price);

  if (copy.length === 0) return copy;
  const prices = copy.map((f) => f.price);
  const durations = copy.map(totalDurationMinutes);
  const priceRange: [number, number] = [Math.min(...prices), Math.max(...prices)];
  const durationRange: [number, number] = [Math.min(...durations), Math.max(...durations)];
  return copy.sort(
    (a, b) => bestScore(a, priceRange, durationRange) - bestScore(b, priceRange, durationRange)
  );
}

function SearchDispatch() {
  const searchParams = useSearchParams();
  const tripType = searchParams.get("tripType") ?? "one-way";
  if (tripType === "multi-city") return <MultiCityResults />;
  return <SearchResults />;
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={<div className="px-4 py-16 text-center text-slate-500">Loading…</div>}
    >
      <SearchDispatch />
    </Suspense>
  );
}
