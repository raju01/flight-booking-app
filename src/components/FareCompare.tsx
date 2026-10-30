"use client";

import { useEffect, useState } from "react";
import { Flight, FlightOffer } from "@/types/flight";
import { formatPrice } from "@/lib/currency";
import { OutboundLink } from "@/lib/outboundLinks";

type State =
  | { status: "loading" }
  | { status: "done"; offers: FlightOffer[] }
  | { status: "error" };

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

  const airline = flight.segments[0].airline;
  const offers = state.status === "done" ? state.offers : [];
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
              {offers.map((offer, index) => (
                <li
                  key={`${offer.seller}-${offer.price}`}
                  className={`flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 border ${
                    index === 0 ? "border-emerald-300 shadow-sm shadow-emerald-100" : "border-slate-200"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {offer.seller}
                      {offer.seller.toLowerCase() === airline.toLowerCase() && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                          Airline
                        </span>
                      )}
                    </p>
                    {index === 0 && (
                      <p className="text-xs font-semibold text-emerald-600">
                        {offers.length > 1 ? "Recommended · lowest price" : "Recommended"}
                      </p>
                    )}
                    {index > 0 && (
                      <p className="text-xs text-slate-400">+{formatPrice(offer.price - lowest.price)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-base font-extrabold text-slate-900">{formatPrice(offer.price)}</p>
                    <button
                      type="button"
                      onClick={() => bookWith(offer)}
                      className={`text-sm font-bold rounded-full px-4 py-2 transition-all active:scale-95 cursor-pointer ${
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
