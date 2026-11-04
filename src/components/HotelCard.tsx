"use client";

import { useEffect, useState } from "react";
import { Hotel, HotelOffer } from "@/types/hotel";
import { formatPrice } from "@/lib/currency";
import { trackEvent } from "@/lib/track";
import { StarIcon } from "@/components/icons";

export interface StayParams {
  place: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  childAges: string; // "5,9", or "" for no children
  nights: number;
}

type OffersState = { status: "loading" } | { status: "done"; offers: HotelOffer[] } | { status: "error" };

const VISIBLE_OFFERS = 5;
// Re-opening a card should not spend another SerpApi credit.
const offersCache = new Map<string, HotelOffer[]>();

function HotelCompare({ hotel, stay }: { hotel: Hotel; stay: StayParams }) {
  const cacheKey = `${hotel.id}|${stay.checkIn}|${stay.checkOut}|${stay.adults}|${stay.childAges}`;
  const [state, setState] = useState<OffersState>(() => {
    const cached = offersCache.get(cacheKey);
    return cached ? { status: "done", offers: cached } : { status: "loading" };
  });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (offersCache.has(cacheKey)) return;
    const controller = new AbortController();
    fetch("/api/hotels/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: hotel.id,
        place: stay.place,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        adults: stay.adults,
        ...(stay.childAges && { childAges: stay.childAges }),
      }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { offers: HotelOffer[] }) => {
        offersCache.set(cacheKey, data.offers);
        setState({ status: "done", offers: data.offers });
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") setState({ status: "error" });
      });
    return () => controller.abort();
  }, [cacheKey, hotel.id, stay]);

  const offers = state.status === "done" ? state.offers : [];
  const shown = showAll ? offers : offers.slice(0, VISIBLE_OFFERS);
  const lowest = offers[0];
  const highest = offers[offers.length - 1];

  return (
    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3 sm:p-4">
      {state.status === "loading" && <p className="text-sm text-slate-500 animate-pulse">Comparing prices across booking sites…</p>}
      {state.status !== "loading" && offers.length === 0 && (
        <p className="text-sm text-slate-600">
          {state.status === "error" ? "Prices from booking sites are unavailable right now." : "No booking site lists a price for these dates."}
        </p>
      )}
      {offers.length > 0 && (
        <>
          <p className="text-sm font-semibold text-slate-800">
            {offers.length === 1 ? "1 site found" : `${offers.length} sites compared · lowest ${formatPrice(lowest.pricePerNight)} a night`}
            {offers.length > 1 && highest.pricePerNight > lowest.pricePerNight && (
              <span className="font-normal text-slate-500">
                {" "}
                (save up to {formatPrice((highest.pricePerNight - lowest.pricePerNight) * stay.nights)} on your stay)
              </span>
            )}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {shown.map((offer, index) => (
              <li
                key={`${offer.seller}-${offer.pricePerNight}`}
                className={`flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 border ${
                  index === 0 ? "border-emerald-300 shadow-sm shadow-emerald-100" : "border-slate-200"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {offer.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Google's own logo host, already sized
                    <img src={offer.logo} alt="" className="h-8 w-8 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1" />
                  ) : (
                    <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-sm font-bold text-white">
                      {offer.seller.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 break-words">
                      {offer.seller}
                      {offer.official && (
                        <span className="ml-2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-amber-700">Hotel&rsquo;s site</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {index === 0 && offers.length > 1 && <span className="font-bold text-emerald-700">★ Lowest price</span>}
                      {index > 0 && <>+{formatPrice(offer.pricePerNight - lowest.pricePerNight)} a night</>}
                      {offer.freeCancellation && (
                        <span className="text-emerald-700">
                          {" · "}Free cancellation{offer.cancelUntil && ` until ${offer.cancelUntil}`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-extrabold text-slate-900">{formatPrice(offer.pricePerNight)}</p>
                    <p className="text-[10px] text-slate-500">
                      {offer.totalPrice ? `${formatPrice(offer.totalPrice)} total` : "a night"}
                    </p>
                  </div>
                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackEvent({ event: "hotel_offer_click", seller: offer.seller, price: offer.pricePerNight, rank: index + 1, sites: offers.length, town: stay.place })
                    }
                    className={`text-sm font-bold rounded-full px-3 sm:px-4 py-2 transition-all active:scale-95 ${
                      index === 0
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-200"
                        : "border-2 border-slate-200 text-slate-700 hover:border-amber-300"
                    }`}
                  >
                    {index === 0 ? (
                      <>
                        Book<span className="hidden sm:inline"> now</span>
                      </>
                    ) : (
                      "Book"
                    )}
                  </a>
                </div>
              </li>
            ))}
          </ul>
          {offers.length > VISIBLE_OFFERS && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-2 w-full rounded-lg border border-dashed border-amber-200 py-2 text-sm font-semibold text-amber-700 hover:bg-white cursor-pointer"
            >
              {showAll ? "Show fewer sites" : `Show ${offers.length - VISIBLE_OFFERS} more sites`}
            </button>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Prices come from Google Hotels for {stay.adults} adult{stay.adults > 1 ? "s" : ""}
            {stay.childAges && ` and ${stay.childAges.split(",").length} child${stay.childAges.includes(",") ? "ren" : ""}`} and can
            change at checkout. Sites may
            price different rooms, so check the room type and what&rsquo;s included before you book.
          </p>
        </>
      )}
    </div>
  );
}

export default function HotelCard({ hotel, stay, style }: { hotel: Hotel; stay: StayParams; style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  return (
    <article style={style} className="flight-card-enter rounded-2xl bg-white border border-slate-200 p-3 sm:p-4 hover:shadow-lg hover:shadow-amber-100 transition-shadow">
      <div className="flex gap-3 sm:gap-4">
        {hotel.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google's photo host, already a thumbnail
          <img src={hotel.image} alt="" loading="lazy" className="h-24 w-24 sm:h-32 sm:w-44 shrink-0 rounded-xl object-cover bg-slate-100" />
        ) : (
          <div className="h-24 w-24 sm:h-32 sm:w-44 shrink-0 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 break-words">{hotel.name}</h3>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                {hotel.stars ? <span className="text-amber-600">{"★".repeat(hotel.stars)} {hotel.stars}-star</span> : null}
                {hotel.kind === "vacation rental" && <span>Holiday home</span>}
                {hotel.rating !== null && (
                  <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-700">
                    <StarIcon className="w-3 h-3" /> {hotel.rating.toFixed(1)}
                    {hotel.reviews !== null && <span className="font-normal text-slate-500">({hotel.reviews.toLocaleString("en-IN")})</span>}
                  </span>
                )}
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              {hotel.pricePerNight !== null ? (
                <>
                  <p className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {formatPrice(hotel.pricePerNight)}
                    <span className="text-xs font-semibold text-slate-500"> /night</span>
                  </p>
                  {hotel.totalPrice !== null && (
                    <p className="text-[11px] text-slate-500">
                      {formatPrice(hotel.totalPrice)} for {stay.nights} night{stay.nights > 1 ? "s" : ""}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">No price listed</p>
              )}
            </div>
          </div>
          {hotel.amenities.length > 0 && (
            <p className="mt-2 hidden sm:block text-xs text-slate-500 line-clamp-1">{hotel.amenities.slice(0, 5).join(" · ")}</p>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-sm font-bold text-white hover:shadow-lg hover:shadow-orange-200 transition-all active:scale-95 cursor-pointer"
          >
            {open ? "Hide prices" : "Compare prices"}
          </button>
        </div>
      </div>
      {open && <HotelCompare hotel={hotel} stay={stay} />}
    </article>
  );
}
