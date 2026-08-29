"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { nearbyAirportCodes } from "@/lib/nearbyAirports";
import { generateMockFlights } from "@/lib/mockFlights";
import { findAirport, formatAirport } from "@/lib/airports";
import { formatPrice } from "@/lib/currency";
import { CabinClass } from "@/types/flight";
import { PlaneIcon } from "@/components/icons";

export default function NearbyAirportSuggestion({
  from,
  to,
  date,
  cabinClass,
  currentLowestPrice,
}: {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
  currentLowestPrice: number | null;
}) {
  const router = useRouter();

  const best = useMemo(() => {
    const candidates = nearbyAirportCodes(to);
    if (candidates.length === 0 || currentLowestPrice === null) return null;

    let bestCode: string | null = null;
    let bestPrice = currentLowestPrice;
    for (const code of candidates) {
      const flights = generateMockFlights({ from, to: code, date, cabinClass });
      if (flights.length === 0) continue;
      const min = Math.min(...flights.map((f) => f.price));
      if (min < bestPrice) {
        bestPrice = min;
        bestCode = code;
      }
    }
    return bestCode ? { code: bestCode, price: bestPrice } : null;
  }, [from, to, date, cabinClass, currentLowestPrice]);

  if (!best) return null;
  const airport = findAirport(best.code);
  if (!airport) return null;

  const savings = currentLowestPrice !== null ? currentLowestPrice - best.price : 0;

  function goToNearby() {
    const params = new URLSearchParams({
      from,
      to: best!.code,
      departDate: date,
      passengers: "1",
      cabinClass,
      tripType: "one-way",
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <button
      type="button"
      onClick={goToNearby}
      className="w-full text-left rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between gap-3 hover:shadow-md transition-all cursor-pointer mb-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-white shrink-0">
          <PlaneIcon className="w-4 h-4" />
        </span>
        <p className="text-sm text-emerald-800">
          <span className="font-bold">Save {formatPrice(savings)}</span> by flying into{" "}
          <span className="font-bold">{formatAirport(airport)}</span> instead — from{" "}
          {formatPrice(best.price)}.
        </p>
      </div>
      <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">View flights →</span>
    </button>
  );
}
