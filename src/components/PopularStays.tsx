"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { addDays, futureDate } from "@/lib/dates";
import { POPULAR_HOTEL_DESTINATIONS } from "@/lib/hotelCities";

const subscribe = () => () => {};
// Quick links for a weekend two weeks out; dates are worked out in the browser so they never lie in the past.
export default function PopularStays() {
  const checkIn = useSyncExternalStore(subscribe, () => futureDate(14), () => "");
  return (
    <div className="flex flex-wrap gap-2">
      {POPULAR_HOTEL_DESTINATIONS.map((d) => {
        const href = checkIn
          ? `/hotel-search?${new URLSearchParams({ place: d.name, checkIn, checkOut: addDays(checkIn, 2), adults: "2" })}`
          : "/hotels";
        return (
          <Link
            key={d.name}
            href={href}
            className="rounded-full border-2 border-amber-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:border-amber-400 hover:text-amber-800 transition-colors"
          >
            {d.name}
          </Link>
        );
      })}
    </div>
  );
}
