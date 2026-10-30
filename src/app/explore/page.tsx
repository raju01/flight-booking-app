"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AirportAutocomplete from "@/components/AirportAutocomplete";
import { generateMockFlights } from "@/lib/mockFlights";
import { findAirport, formatAirport, isIndianCode, registerAirport } from "@/lib/airports";
import { futureDate } from "@/lib/dates";
import { formatPrice } from "@/lib/currency";
import { placeName } from "@/lib/routes";
import { PlaneIcon } from "@/components/icons";
import type { ExploreDestination } from "@/lib/serpExplore";

type Region = "all" | "india" | "world";

const REGIONS: [Region, string][] = [
  ["all", "All"],
  ["india", "India"],
  ["world", "International"],
];

const PAGE_SIZE = 18;

const SAMPLE_DESTINATIONS = [
  "BOM", "BLR", "HYD", "MAA", "CCU", "PNQ", "AMD", "GOI", "COK", "JAI",
  "LKO", "IXC", "GAU", "PAT", "ATQ", "BBI", "NAG", "VNS", "TRV", "CJB",
];

function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function ExplorePage() {
  const router = useRouter();
  const [from, setFrom] = useState("DEL");
  const [region, setRegion] = useState<Region>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [live, setLive] = useState<{ from: string; destinations: ExploreDestination[] } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/explore?from=${from}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { destinations: [] }))
      .then((body: { destinations: ExploreDestination[] }) => {
        // Google sometimes leaves the country blank (Leh, for one); the airport list knows better.
        const destinations = body.destinations.map((d) => ({
          ...d,
          country: d.country || (isIndianCode(d.code) ? "India" : ""),
        }));
        for (const d of destinations) {
          registerAirport({ code: d.code, city: d.name, name: d.name, country: d.country === "India" ? undefined : d.country });
        }
        setLive({ from, destinations });
      })
      .catch(() => {}); // aborted by a newer origin
    return () => controller.abort();
  }, [from]);

  const isLoading = live?.from !== from;
  const hasLive = !isLoading && live.destinations.length > 0;

  // Without live data, fall back to clearly labelled sample fares for Indian destinations.
  const sampleDestinations = useMemo<ExploreDestination[]>(() => {
    const fromAirport = findAirport(from);
    if (!fromAirport) return [];
    const [outbound, back] = [futureDate(14), futureDate(21)];
    return SAMPLE_DESTINATIONS.filter((code) => code !== from).flatMap((code) => {
      const to = findAirport(code);
      const flights = to ? generateMockFlights({ from, to: code, date: outbound, cabinClass: "Economy" }) : [];
      if (!to || flights.length === 0) return [];
      return [{
        code, name: placeName(to), country: to.country ?? "India", price: Math.min(...flights.map((f) => f.price)) * 2,
        startDate: outbound, endDate: back, stops: 0, durationMinutes: 0, airline: "",
      }];
    }).sort((a, b) => a.price - b.price);
  }, [from]);

  const all = hasLive ? live.destinations : isLoading ? [] : sampleDestinations;
  const filtered = all.filter((d) => region === "all" || (region === "india") === (d.country === "India"));
  const shown = filtered.slice(0, visible);

  function goToSearch(d: ExploreDestination) {
    router.push(
      `/search?${new URLSearchParams({
        from,
        to: d.code,
        departDate: d.startDate,
        returnDate: d.endDate,
        passengers: "1",
        adults: "1",
        children: "0",
        infants: "0",
        cabinClass: "Economy",
        tripType: "round-trip",
      })}`
    );
  }

  const fromAirport = findAirport(from);

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 mb-1">
        <PlaneIcon className="w-6 h-6 text-fuchsia-500" />
        Explore anywhere
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Not sure where to go? See the cheapest return fares from your city to places in India and around the world.
      </p>

      <div className="glass-card rounded-2xl p-4 mb-6 max-w-sm">
        <AirportAutocomplete label="Flying from" value={from} onChange={(code) => { setFrom(code); setVisible(PAGE_SIZE); }} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div role="tablist" aria-label="Region" className="flex gap-2">
          {REGIONS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={region === key}
              onClick={() => { setRegion(key); setVisible(PAGE_SIZE); }}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
                region === key ? "bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white shadow-md shadow-violet-200" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {fromAirport && !isLoading && (
          <p className="text-xs text-slate-500">
            {hasLive ? "Live return fares from" : "Sample fares from"} {formatAirport(fromAirport)}
            {!hasLive && " · live fares are unavailable right now"}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-200 overflow-hidden animate-pulse">
              <div className="h-32 bg-slate-100" />
              <div className="p-4 space-y-2"><div className="h-4 w-1/2 bg-slate-100 rounded" /><div className="h-6 w-1/3 bg-slate-100 rounded" /></div>
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="text-slate-500">No destinations found for this filter. Try another region or airport.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((d) => (
              <button
                key={d.code}
                type="button"
                onClick={() => goToSearch(d)}
                className="text-left rounded-2xl bg-white border border-slate-200 overflow-hidden hover:shadow-lg hover:shadow-indigo-100 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                {d.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Google's thumbnail host, already sized
                  <img src={d.thumbnail} alt="" loading="lazy" className="h-32 w-full object-cover" />
                ) : (
                  <div className="h-32 w-full bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100" />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-slate-900 truncate">{findAirport(d.code)?.city ?? d.name}</p>
                    <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">{d.code}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{d.country}</p>
                  <p className="text-2xl font-extrabold gradient-text [--gradient-from:theme(colors.indigo.600)] [--gradient-to:theme(colors.fuchsia.500)]">
                    {formatPrice(d.price)}
                    <span className="ml-1 text-xs font-medium text-slate-500">return</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatShortDate(d.startDate)} – {formatShortDate(d.endDate)}
                    {d.airline && ` · ${d.airline}`}
                    {d.airline && ` · ${d.stops === 0 ? "nonstop" : `${d.stops} stop${d.stops > 1 ? "s" : ""}`}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
          {filtered.length > shown.length && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="mt-6 mx-auto block rounded-full border-2 border-indigo-200 px-6 py-2.5 font-semibold text-indigo-600 hover:bg-indigo-50 cursor-pointer"
            >
              Show more destinations
            </button>
          )}
        </>
      )}
    </div>
  );
}
