"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BusIcon } from "@/components/icons";
import { formatPrice } from "@/lib/currency";
import { findAirport } from "@/lib/airports";
import { payingTravelers } from "@/lib/party";
import { Bus } from "@/types/bus";
import { TravelerCounts } from "@/types/traveler";

// A bus that takes much longer than a day-trip is not a real alternative to a flight.
const MAX_BUS_MINUTES = 16 * 60;

function formatDuration(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function cityOf(code: string): string {
  return (findAirport(code)?.city ?? code).replace(/\s*\(.*\)$/, "");
}

interface Summary {
  count: number;
  fastest: number;
  cheapestFare: number | null; // per seat, when Google lists fares for this route
}

// "Or go by road": real bus timings (and fares, when Google has them) beside the flight. Only shown for
// live data on routes where direct buses exist, so it never invents an option.
export default function RoadAlternative({
  from,
  to,
  date,
  travelers,
  flightLowest,
  flightFastest,
}: {
  from: string;
  to: string;
  date: string;
  travelers: TravelerCounts;
  flightLowest: number;
  flightFastest: number;
}) {
  const [loaded, setLoaded] = useState<{ key: string; summary: Summary | null } | null>(null);
  const key = `${from}|${to}|${date}`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/buses?${new URLSearchParams({ from, to, date })}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { source: string; buses: Bus[] } | null) => {
        const buses = body?.source === "live" ? body.buses.filter((b) => b.durationMinutes <= MAX_BUS_MINUTES) : [];
        const fares = buses.map((b) => b.price).filter((p): p is number => typeof p === "number");
        setLoaded({
          key,
          summary: buses.length
            ? {
                count: buses.length,
                fastest: Math.min(...buses.map((b) => b.durationMinutes)),
                cheapestFare: fares.length ? Math.min(...fares) : null,
              }
            : null,
        });
      })
      .catch(() => {}); // page left
    return () => controller.abort();
  }, [from, to, date, key]);

  if (loaded?.key !== key || !loaded.summary) return null;
  const { count, fastest, cheapestFare } = loaded.summary;

  const seats = payingTravelers(travelers);
  const busTotal = cheapestFare !== null ? cheapestFare * seats : null;
  const saving = busTotal !== null ? flightLowest - busTotal : null;

  const fromCity = cityOf(from);
  const toCity = cityOf(to);
  const redbus = `/api/out?${new URLSearchParams({ type: "bus", from: fromCity, to: toCity, date })}`;
  const compare = `/bus-search?${new URLSearchParams({ from, to, travelDate: date, passengers: String(seats) })}`;

  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <BusIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900">
            Or go by road · {count} direct {count === 1 ? "bus" : "buses"} {fromCity} to {toCity}
          </p>

          <dl className="mt-2 grid grid-cols-2 gap-3 text-sm sm:max-w-md">
            <div className="rounded-xl bg-white px-3 py-2 border border-slate-200">
              <dt className="text-xs text-slate-500">By air</dt>
              <dd className="font-bold text-slate-900">{formatDuration(flightFastest)}</dd>
              <dd className="text-xs text-slate-500">from {formatPrice(flightLowest)}</dd>
            </div>
            <div className="rounded-xl bg-white px-3 py-2 border border-emerald-200">
              <dt className="text-xs text-slate-500">By bus</dt>
              <dd className="font-bold text-slate-900">{formatDuration(fastest)}</dd>
              <dd className="text-xs text-slate-500">
                {busTotal !== null
                  ? `from ${formatPrice(cheapestFare!)} a seat${seats > 1 ? ` (${formatPrice(busTotal)} for ${seats})` : ""}`
                  : "fares on redBus"}
              </dd>
            </div>
          </dl>

          {saving !== null && saving > 0 && (
            <p className="mt-2 text-sm font-semibold text-emerald-800">
              About {formatPrice(saving)} less than flying, for {formatDuration(fastest - flightFastest)} more travel time.
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Bus times and fares come from Google and can change. Travel time excludes getting to and from the airport or
            bus stop.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={redbus}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-bold text-white hover:shadow-lg hover:shadow-emerald-200"
            >
              See buses on redBus
            </a>
            <Link
              href={compare}
              className="rounded-full border-2 border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 hover:border-emerald-300"
            >
              Compare bus timings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
