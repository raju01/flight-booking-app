"use client";

import { useEffect, useState } from "react";
import { Flight, FlightOffer } from "@/types/flight";
import { formatPrice } from "@/lib/currency";
import { OutboundLink } from "@/lib/outboundLinks";

type State =
  | { status: "loading" }
  | { status: "done"; offers: FlightOffer[] }
  | { status: "error" };

const AVATAR_COLORS = ["bg-indigo-500", "bg-fuchsia-500", "bg-emerald-500", "bg-amber-500", "bg-sky-500", "bg-rose-500", "bg-teal-500"];

function SellerAvatar({ name }: { name: string }) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className={`hidden sm:flex shrink-0 w-9 h-9 rounded-full ${AVATAR_COLORS[hash % AVATAR_COLORS.length]} text-white text-sm font-bold items-center justify-center`}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

const VISIBLE_OFFERS = 5;

// Re-opening a card should not spend another SerpApi credit.
const offersCache = new Map<string, FlightOffer[]>();

// Google hands out a booking form (URL plus fields), not a plain link, so submit it in a new tab.
function bookWith(offer: FlightOffer) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = offer.url;
  form.target = "_blank";
  form.rel = "noopener noreferrer";
  for (const [name, value] of new URLSearchParams(offer.postData)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

function shareOnWhatsApp(flight: Flight, price: number) {
  const first = flight.segments[0];
  const last = flight.segments[flight.segments.length - 1];
  const day = new Date(first.departureTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const text = `${first.from.code} → ${last.to.code} on ${day}: ${formatPrice(price)} with ${first.airline}. Compare prices: ${window.location.href}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

export default function FareCompare({
  flight,
  alternatives,
}: {
  flight: Flight;
  alternatives: OutboundLink[];
}) {
  const token = flight.bookingToken ?? "";
  const [state, setState] = useState<State>(() => {
    const cached = offersCache.get(token);
    return cached ? { status: "done", offers: cached } : { status: "loading" };
  });

  useEffect(() => {
    if (!token || offersCache.has(token)) return;
    const controller = new AbortController();
    const first = flight.segments[0];
    const last = flight.segments[flight.segments.length - 1];
    fetch("/api/flights/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: first.from.code,
        to: last.to.code,
        date: first.departureTime.slice(0, 10),
        cabinClass: flight.cabinClass,
        token,
      }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { offers: FlightOffer[] }) => {
        offersCache.set(token, data.offers);
        setState({ status: "done", offers: data.offers });
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") setState({ status: "error" });
      });
    return () => controller.abort();
  }, [token, flight]);

  const [showAll, setShowAll] = useState(false);
  const airline = flight.segments[0].airline;
  const offers = state.status === "done" ? state.offers : [];
  const shown = showAll ? offers : offers.slice(0, VISIBLE_OFFERS);
  const lowest = offers[0];
  const highest = offers[offers.length - 1];

  return (
    <div className="px-4 sm:px-5 pb-4 sm:pb-5">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 sm:p-4">
        {state.status === "loading" && (
          <p className="text-sm text-slate-500 animate-pulse">Comparing prices across sellers…</p>
        )}

        {state.status !== "loading" && offers.length === 0 && (
          <p className="text-sm text-slate-600">
            {state.status === "error"
              ? "Seller prices are unavailable right now."
              : "Only one seller listed this flight."}{" "}
            Try one of the options below.
          </p>
        )}

        {offers.length > 0 && (
          <>
            <p className="text-sm font-semibold text-slate-800">
              {offers.length === 1
                ? "1 seller found"
                : `${offers.length} sellers compared · lowest ${formatPrice(lowest.price)}`}
              {offers.length > 1 && highest.price > lowest.price && (
                <span className="font-normal text-slate-500">
                  {" "}
                  (save up to {formatPrice(highest.price - lowest.price)})
                </span>
              )}
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {shown.map((offer, index) => (
                <li
                  key={`${offer.seller}-${offer.price}`}
                  className={`flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 border ${
                    index === 0 ? "border-emerald-300 shadow-sm shadow-emerald-100" : "border-slate-200"
                  }`}
                >
                  <SellerAvatar name={offer.seller} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 break-words">
                      {offer.seller}
                      {offer.seller.toLowerCase() === airline.toLowerCase() && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                          Airline
                        </span>
                      )}
                    </p>
                    {index === 0 && (
                      <p className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        ★ Recommended
                        {offers.length > 1 && <span className="hidden sm:inline"> · lowest price</span>}
                      </p>
                    )}
                    {index > 0 && (
                      <p className="text-xs text-slate-400">+{formatPrice(offer.price - lowest.price)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <p className="text-sm sm:text-base font-extrabold text-slate-900">{formatPrice(offer.price)}</p>
                    <button
                      type="button"
                      onClick={() => bookWith(offer)}
                      className={`text-sm font-bold rounded-full px-3 sm:px-4 py-2 transition-all active:scale-95 cursor-pointer ${
                        index === 0
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-200"
                          : "border-2 border-slate-200 text-slate-700 hover:border-indigo-300"
                      }`}
                    >
                      {index === 0 ? "Book now" : "Book"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {offers.length > VISIBLE_OFFERS && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="mt-2 w-full rounded-lg border border-dashed border-indigo-200 py-2 text-sm font-semibold text-indigo-600 hover:bg-white cursor-pointer"
              >
                {showAll ? "Show fewer sellers" : `Show ${offers.length - VISIBLE_OFFERS} more sellers`}
              </button>
            )}
          </>
        )}

        {alternatives.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => shareOnWhatsApp(flight, lowest?.price ?? flight.price)}
              className="font-semibold text-emerald-600 hover:underline cursor-pointer mr-2"
            >
              Share on WhatsApp
            </button>
            <span>Also check:</span>
            {alternatives.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="font-semibold text-indigo-600 hover:underline"
              >
                {link.seller}
              </a>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          Prices come from Google Flights and can change at checkout. We list sellers by price, not by
          commission.
        </p>
      </div>
    </div>
  );
}
