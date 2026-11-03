"use client";

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import HotelCard, { StayParams } from "@/components/HotelCard";
import HotelSuggestion from "@/components/HotelSuggestion";
import UnavailableNotice from "@/components/UnavailableNotice";
import DataSourceBadge from "@/components/DataSourceBadge";
import { HotelIcon } from "@/components/icons";
import { formatPrice } from "@/lib/currency";
import { parseISODate, todayInIndia } from "@/lib/dates";
import { stayPlace } from "@/lib/hotelCities";
import type { DataSource } from "@/lib/flightSearch";
import { Hotel, StayKind } from "@/types/hotel";

type SortBy = "price" | "rating" | "stars";
const subscribe = () => () => {};

const prettyDate = (iso: string) =>
  parseISODate(iso)?.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) ?? iso;

function HotelResults() {
  const searchParams = useSearchParams();
  const city = searchParams.get("city") ?? "";
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const adults = Number(searchParams.get("adults") ?? "2") || 2;
  const place = stayPlace(city);
  const today = useSyncExternalStore(subscribe, todayInIndia, () => "");

  const start = parseISODate(checkIn);
  const end = parseISODate(checkOut);
  const nights = start && end ? Math.round((end.getTime() - start.getTime()) / 86_400_000) : 0;
  const stay = useMemo<StayParams>(() => ({ city, checkIn, checkOut, adults, nights }), [city, checkIn, checkOut, adults, nights]);

  const searchKey = `${city}|${checkIn}|${checkOut}|${adults}`;
  const [results, setResults] = useState<{ key: string; hotels: Hotel[]; source: DataSource } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("price");
  const [minStars, setMinStars] = useState(0);
  const [kind, setKind] = useState<"any" | StayKind>("any");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const valid = Boolean(place && nights >= 1);
  const passed = Boolean(today && checkIn && checkIn < today);

  useEffect(() => {
    if (!valid || passed || !today) return;
    const controller = new AbortController();
    fetch(`/api/hotels?${new URLSearchParams({ city, checkIn, checkOut, adults: String(adults) })}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { hotels: Hotel[]; source: DataSource }) => setResults({ key: searchKey, hotels: body.hotels, source: body.source }))
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") setFailedKey(searchKey);
      });
    return () => controller.abort();
  }, [valid, passed, today, city, checkIn, checkOut, adults, searchKey]);

  const current = results?.key === searchKey ? results : null;
  const hotels = useMemo(() => current?.hotels ?? [], [current]);
  const priceCeiling = useMemo(() => Math.max(0, ...hotels.map((h) => h.pricePerNight ?? 0)), [hotels]);
  const shown = useMemo(() => {
    const list = hotels.filter(
      (h) =>
        (h.stars ?? 0) >= minStars &&
        (kind === "any" || h.kind === kind) &&
        (maxPrice === null || (h.pricePerNight !== null && h.pricePerNight <= maxPrice))
    );
    const unpricedLast = (h: Hotel) => h.pricePerNight ?? Number.MAX_SAFE_INTEGER;
    if (sortBy === "rating") return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sortBy === "stars") return [...list].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0) || unpricedLast(a) - unpricedLast(b));
    return [...list].sort((a, b) => unpricedLast(a) - unpricedLast(b));
  }, [hotels, minStars, kind, maxPrice, sortBy]);
  const filtersActive = minStars > 0 || kind !== "any" || maxPrice !== null;

  if (!valid) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Missing or invalid stay details.</p>
        <Link href="/hotels" className="mt-4 inline-block text-amber-700 font-semibold underline">
          Back to hotel search
        </Link>
      </div>
    );
  }
  if (passed) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="font-bold text-slate-900">That check-in date has passed</p>
        <p className="mt-1 text-slate-600">Hotels can be booked from today onwards.</p>
        <Link href="/hotels" className="mt-4 inline-block text-amber-700 font-semibold underline">
          Pick new dates
        </Link>
      </div>
    );
  }

  const loading = !current && failedKey !== searchKey;
  const unavailable = failedKey === searchKey || current?.source === "unavailable";

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
            <HotelIcon className="w-6 h-6 text-orange-500" />
            Hotels in {place!.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {prettyDate(checkIn)} – {prettyDate(checkOut)} · {nights} night{nights > 1 ? "s" : ""} · {adults} guest
            {adults > 1 ? "s" : ""}
            {current && (
              <span className="ml-2 align-middle">
                <DataSourceBadge source={current.source} liveLabel="Live prices" />
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="hotel-sort" className="text-slate-500 font-medium">
            Sort by
          </label>
          <select
            id="hotel-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="border-2 border-slate-200 rounded-full px-3 py-1.5 bg-white cursor-pointer focus:outline-none focus:border-amber-400"
          >
            <option value="price">Lowest price</option>
            <option value="rating">Guest rating</option>
            <option value="stars">Star class</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <aside className="sm:w-60 shrink-0">
          <div className="glass-card rounded-2xl p-4 sm:sticky sm:top-20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-slate-900">Filters</h2>
              {filtersActive && (
                <button
                  type="button"
                  onClick={() => {
                    setMinStars(0);
                    setKind("any");
                    setMaxPrice(null);
                  }}
                  className="text-xs text-amber-700 font-semibold hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Star class</p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {[0, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMinStars(n)}
                  aria-pressed={minStars === n}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-semibold cursor-pointer ${
                    minStars === n ? "border-amber-400 bg-amber-50 text-amber-800" : "border-slate-200 text-slate-600"
                  }`}
                >
                  {n === 0 ? "Any" : `${n}★${n < 5 ? "+" : ""}`}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Type</p>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "any" | StayKind)}
              className="mb-4 w-full border-2 border-slate-200 rounded-xl px-2 py-1.5 text-sm bg-white cursor-pointer focus:outline-none focus:border-amber-400"
              aria-label="Type of stay"
            >
              <option value="any">Hotels and holiday homes</option>
              <option value="hotel">Hotels only</option>
              <option value="vacation rental">Holiday homes only</option>
            </select>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              Max per night {maxPrice !== null ? `· ${formatPrice(maxPrice)}` : ""}
            </p>
            <input
              type="range"
              aria-label="Maximum price per night"
              min={0}
              max={priceCeiling || 1}
              step={100}
              value={maxPrice ?? priceCeiling}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {unavailable ? (
            <UnavailableNotice what="hotel prices" />
          ) : loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="relative h-36 rounded-2xl bg-slate-100 overflow-hidden">
                  <div className="shimmer absolute inset-0" />
                </div>
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm bg-white/50">
              {hotels.length === 0 ? "No stays listed for these dates. Try other dates." : "No stays match your filters. Try adjusting them."}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {shown.map((hotel, i) => (
                <HotelCard key={hotel.id} hotel={hotel} stay={stay} style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }} />
              ))}
            </div>
          )}
          {!loading && !unavailable && <HotelSuggestion city={city} className="mt-6" />}
          {!loading && !unavailable && (
            <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
              Prices come from Google Hotels for your guests and dates, and can change at checkout. We list booking
              sites by price, not by commission.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HotelSearchPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-slate-500">Loading…</div>}>
      <HotelResults />
    </Suspense>
  );
}
