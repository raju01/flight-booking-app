"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/currency";
import { parseISODate } from "@/lib/dates";
import { findAirport } from "@/lib/airports";
import type { ExploreDestination } from "@/lib/serpExplore";

const ORIGIN = "DEL";
const MAX_ENTRIES = 12;

function shortDate(iso: string): string {
  return parseISODate(iso)?.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) ?? "";
}

// Cheapest return fares from Delhi right now. Real data only: if it cannot be loaded the strip is
// left out rather than filled with invented prices.
export default function FareTicker() {
  const [entries, setEntries] = useState<ExploreDestination[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/explore?from=${ORIGIN}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { source: "mock", destinations: [] }))
      .then((body: { source: string; destinations: ExploreDestination[] }) => {
        if (body.source === "live") setEntries(body.destinations.slice(0, MAX_ENTRIES));
      })
      .catch(() => {}); // page left, or offline: show nothing
    return () => controller.abort();
  }, []);

  if (entries.length === 0) return null;

  const loopEntries = [...entries, ...entries];

  return (
    <div className="overflow-hidden border-y border-white/15 bg-black/10" aria-label={`Cheapest return fares from ${findAirport(ORIGIN)?.city}`}>
      <div className="marquee-track flex w-max hover:[animation-play-state:paused]">
        {loopEntries.map((entry, i) => (
          <Link
            key={`${entry.code}-${i}`}
            href={`/search?${new URLSearchParams({
              from: ORIGIN,
              to: entry.code,
              departDate: entry.startDate,
              returnDate: entry.endDate,
              passengers: "1",
              adults: "1",
              children: "0",
              infants: "0",
              cabinClass: "Economy",
              tripType: "round-trip",
            })}`}
            tabIndex={i < entries.length ? 0 : -1}
            aria-hidden={i >= entries.length}
            className="flex items-center gap-2 px-6 py-2.5 text-sm text-white/90 whitespace-nowrap border-r border-white/10 hover:bg-white/10"
          >
            <span className="font-semibold">
              {ORIGIN} → {entry.code}
            </span>
            <span className="text-white/60">·</span>
            <span className="text-white/80">{findAirport(entry.code)?.city ?? entry.name}</span>
            <span className="font-bold">{formatPrice(entry.price)}</span>
            <span className="text-white/70 text-xs">
              return · {shortDate(entry.startDate)}
              {entry.airline && ` · ${entry.airline}`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
