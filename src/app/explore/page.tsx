"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AirportAutocomplete from "@/components/AirportAutocomplete";
import { generateMockFlights } from "@/lib/mockFlights";
import { findAirport, formatAirport } from "@/lib/airports";
import { formatPrice } from "@/lib/currency";
import { PlaneIcon } from "@/components/icons";
import { Airport, CabinClass } from "@/types/flight";

interface ExploreResult {
  airport: Airport;
  price: number;
  date: string;
}

const EXPLORE_DESTINATIONS = [
  "BOM", "BLR", "HYD", "MAA", "CCU", "PNQ", "AMD", "GOI", "COK", "JAI",
  "LKO", "IXC", "GAU", "PAT", "ATQ", "BBI", "NAG", "VNS", "TRV", "CJB",
];

function firstOfNextMonths(count: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, Math.min(now.getDate() + 7, 28));
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function ExplorePage() {
  const router = useRouter();
  const [from, setFrom] = useState("DEL");
  const [cabinClass] = useState<CabinClass>("Economy");
  const sampleDates = useMemo(() => firstOfNextMonths(2), []);

  const results = useMemo(() => {
    const fromAirport = findAirport(from);
    if (!fromAirport) return [];

    return EXPLORE_DESTINATIONS.filter((code) => code !== from)
      .map((code) => {
        const toAirport = findAirport(code);
        if (!toAirport) return null;
        let cheapest: number | null = null;
        let cheapestDate = sampleDates[0];
        for (const date of sampleDates) {
          const flights = generateMockFlights({ from, to: code, date, cabinClass });
          if (flights.length === 0) continue;
          const min = Math.min(...flights.map((f) => f.price));
          if (cheapest === null || min < cheapest) {
            cheapest = min;
            cheapestDate = date;
          }
        }
        return cheapest === null ? null : { airport: toAirport, price: cheapest, date: cheapestDate };
      })
      .filter((r): r is ExploreResult => r !== null)
      .sort((a, b) => a.price - b.price);
  }, [from, cabinClass, sampleDates]);

  function goToSearch(toCode: string, date: string) {
    const params = new URLSearchParams({
      from,
      to: toCode,
      departDate: date,
      passengers: "1",
      cabinClass,
      tripType: "one-way",
    });
    router.push(`/search?${params.toString()}`);
  }

  const fromAirport = findAirport(from);

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 mb-1">
        <PlaneIcon className="w-6 h-6 text-fuchsia-500" />
        Explore anywhere
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Not sure where to go? See the cheapest fares from your city to destinations across India.
      </p>

      <div className="glass-card rounded-2xl p-4 mb-8 max-w-sm">
        <AirportAutocomplete label="Flying from" value={from} onChange={setFrom} />
      </div>

      {fromAirport && (
        <>
          <p className="text-sm text-slate-500 mb-4">
            Cheapest one-way fares from {formatAirport(fromAirport)} over the next couple of
            months
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(({ airport, price, date }) => (
              <button
                key={airport.code}
                type="button"
                onClick={() => goToSearch(airport.code, date)}
                className="text-left rounded-2xl bg-white border border-slate-200 p-4 hover:shadow-lg hover:shadow-indigo-100 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-slate-900">{airport.city}</p>
                  <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                    {airport.code}
                  </span>
                </div>
                <p className="text-2xl font-extrabold gradient-text [--gradient-from:theme(colors.indigo.600)] [--gradient-to:theme(colors.fuchsia.500)] mb-1">
                  {formatPrice(price)}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
