"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { addDays, futureDate } from "@/lib/dates";
import { stayPlace } from "@/lib/hotelCities";

const subscribe = () => () => {};
const POPULAR = ["GOI", "JAI", "UDR", "COK", "SXR", "IXL", "IXZ", "VNS", "BOM", "DEL", "BLR", "DXB", "BKK", "SIN"];

// Quick links for a weekend two weeks out; dates are worked out in the browser so they never lie in the past.
export default function PopularStays() {
  const checkIn = useSyncExternalStore(subscribe, () => futureDate(14), () => "");
  return (
    <div className="flex flex-wrap gap-2">
      {POPULAR.map((code) => {
        const place = stayPlace(code);
        if (!place) return null;
        const href = checkIn
          ? `/hotel-search?${new URLSearchParams({ city: code, checkIn, checkOut: addDays(checkIn, 2), adults: "2" })}`
          : "/hotels";
        return (
          <Link
            key={code}
            href={href}
            className="rounded-full border-2 border-amber-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:border-amber-400 hover:text-amber-800 transition-colors"
          >
            {place.name}
          </Link>
        );
      })}
    </div>
  );
}
