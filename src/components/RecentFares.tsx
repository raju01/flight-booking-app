"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { formatPrice } from "@/lib/currency";
import { todayInIndia } from "@/lib/dates";
import type { SeenFare } from "@/lib/recentFares";

const subscribe = () => () => {};
const VISIBLE = 8;

// "Fri, 20 Nov" for a travel date (YYYY-MM-DD).
const travelDay = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
// "3 Nov" for when a search ran, in India time.
const checkedDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

// The page is prerendered and refreshed hourly, so days that have passed since are dropped in the browser.
export default function RecentFares({ from, to, fares }: { from: string; to: string; fares: SeenFare[] }) {
  const today = useSyncExternalStore(subscribe, todayInIndia, () => "");
  const upcoming = fares.filter((f) => f.date >= today).slice(0, VISIBLE);
  if (upcoming.length === 0) return null;
  // Only worth pointing out when there is more than one date to compare.
  const cheapest = upcoming.length > 1 ? Math.min(...upcoming.map((f) => f.price)) : null;

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-extrabold text-slate-900">Fares found recently</h2>
      <p className="mt-1 text-sm text-slate-500">
        The lowest one-way economy fare for one adult that a search on our site found for each date. Fares change
        often, so search to see today&rsquo;s price and every seller.
      </p>
      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {upcoming.map((fare) => (
          <li key={fare.date}>
            <Link
              href={`/search?${new URLSearchParams({
                from,
                to,
                departDate: fare.date,
                passengers: "1",
                adults: "1",
                children: "0",
                infants: "0",
                cabinClass: "Economy",
                tripType: "one-way",
              })}`}
              className={`flex items-center justify-between gap-3 rounded-2xl bg-white border px-4 py-3 hover:shadow-lg hover:shadow-indigo-100 transition-all ${
                fare.price === cheapest ? "border-emerald-300" : "border-slate-200 hover:border-indigo-300"
              }`}
            >
              <span>
                <span className="block font-semibold text-slate-900">{travelDay(fare.date)}</span>
                <span className="block text-xs text-slate-500">
                  {fare.airline} · checked {checkedDay(fare.seenAt)}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-lg font-extrabold text-slate-900">{formatPrice(fare.price)}</span>
                {fare.price === cheapest && (
                  <span className="block text-[11px] font-bold text-emerald-700">Cheapest here</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
