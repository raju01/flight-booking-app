"use client";

import { useEffect, useState } from "react";
import { Flight, FlightOffer } from "@/types/flight";
import { formatPrice } from "@/lib/currency";
import { OutboundLink } from "@/lib/outboundLinks";
import { trackEvent } from "@/lib/track";
import { baggageSummary, includesCheckedBag } from "@/lib/baggage";
import { isIndianAirport } from "@/lib/airports";
import { SOLO, describeParty, payingTravelers, perPerson } from "@/lib/party";

type State =
  | { status: "loading" }
  | { status: "done"; offers: FlightOffer[] }
  | { status: "error" };

const AVATAR_COLORS = ["bg-indigo-500", "bg-fuchsia-500", "bg-emerald-500", "bg-amber-500", "bg-sky-500", "bg-rose-500", "bg-teal-500"];

function SellerAvatar({ name, logo }: { name: string; logo?: string }) {
  const [failed, setFailed] = useState(false);
  if (logo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Google's own logo host, already sized
      <img
        src={logo}
        alt=""
        onError={() => setFailed(true)}
        className="shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-lg border border-slate-200 bg-white object-contain p-1"
      />
    );
  }
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className={`flex shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-lg ${AVATAR_COLORS[hash % AVATAR_COLORS.length]} text-white text-sm font-bold items-center justify-center`}
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
        ...(flight.travelers ?? SOLO),
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
  // Sellers differ in what the fare includes, so the list can be narrowed to those with a checked bag.
  const [bagOnly, setBagOnly] = useState(false);
  // Within India a checked bag is normally part of the fare even when Google does not list it, so filtering
  // on "listed" would hide most good sellers. The filter is for routes that leave or enter India only.
  const domestic = flight.segments.every((s) => isIndianAirport(s.from) && isIndianAirport(s.to));
  // Confirmed by Google: say so firmly. Within India, a checked bag is normally part of an economy fare even
  // when Google does not list it, so say "usually" there (never for routes that leave or enter India).
  const baggageNote = (offer: FlightOffer): string | null =>
    baggageSummary(offer) ?? (domestic ? "Check-in bag usually included" : null);
  const canFilterBags = !domestic && offers.some(includesCheckedBag) && offers.some((o) => !includesCheckedBag(o));
  const listed = bagOnly && canFilterBags ? offers.filter(includesCheckedBag) : offers;
  const shown = showAll ? listed : listed.slice(0, VISIBLE_OFFERS);
  const lowest = offers[0];
  const top = listed[0];
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
              {payingTravelers(flight.travelers) > 1 && (
                <span className="font-normal text-slate-500"> for {describeParty(flight.travelers)}</span>
              )}
              {offers.length > 1 && highest.price > lowest.price && (
                <span className="font-normal text-slate-500">
                  {" "}
                  (save up to {formatPrice(highest.price - lowest.price)})
                </span>
              )}
            </p>
            {lowest.price > flight.price && (
              <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
                The search listed {formatPrice(flight.price)}, but the current booking price is{" "}
                {formatPrice(lowest.price)}. Google shows two figures for this flight; the booking price is what the
                seller will charge.
              </p>
            )}
            {canFilterBags && (
              <label className="mt-3 flex w-fit items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bagOnly}
                  onChange={(e) => {
                    setBagOnly(e.target.checked);
                    setShowAll(false);
                  }}
                  className="accent-indigo-600"
                />
                Only sellers that list a checked bag
              </label>
            )}
            <ul className="mt-3 flex flex-col gap-2">
              {shown.map((offer, index) => (
                <li
                  key={`${offer.seller}-${offer.price}`}
                  className={`flex flex-col gap-1.5 rounded-lg bg-white px-3 py-2.5 border ${
                    index === 0 ? "border-emerald-300 shadow-sm shadow-emerald-100" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                  <SellerAvatar name={offer.seller} logo={offer.logo} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 break-words">
                      {offer.seller}
                      {offer.seller.toLowerCase() === airline.toLowerCase() && (
                        <span className="ml-2 inline-block whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                          Airline
                        </span>
                      )}
                    </p>
                    {index === 0 && (
                      <p className="hidden sm:inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        ★ Recommended
                        {listed.length > 1 && <span className="hidden sm:inline"> · lowest price</span>}
                      </p>
                    )}
                    {(index > 0 || baggageNote(offer)) && (
                      <p
                        className="text-xs text-slate-500"
                        title={
                          includesCheckedBag(offer)
                            ? offer.baggage?.join(" · ")
                            : domestic
                              ? "Most Indian domestic economy fares include check-in baggage. Google doesn't list it for this seller, so confirm on their site before you book."
                              : undefined
                        }
                      >
                        {index > 0 && <>+{formatPrice(offer.price - top.price)}</>}
                        {index > 0 && baggageNote(offer) && " · "}
                        {baggageNote(offer) && (
                          <span className={includesCheckedBag(offer) ? "font-semibold text-emerald-700" : "text-slate-600"}>
                            <span className="text-emerald-600">✓</span> {baggageNote(offer)}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-extrabold text-slate-900">{formatPrice(offer.price)}</p>
                      {payingTravelers(flight.travelers) > 1 && (
                        <p className="text-[10px] text-slate-500">{formatPrice(perPerson(offer.price, flight.travelers))} each</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        trackEvent({
                          event: "offer_click",
                          seller: offer.seller,
                          price: offer.price,
                          rank: index + 1,
                          sellers: offers.length,
                          savings: offer.price - lowest.price,
                          bag: includesCheckedBag(offer),
                          route: `${flight.segments[0].from.code}-${flight.segments[flight.segments.length - 1].to.code}`,
                        });
                        bookWith(offer);
                      }}
                      className={`text-sm font-bold rounded-full px-3 sm:px-4 py-2 transition-all active:scale-95 cursor-pointer ${
                        index === 0
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-200"
                          : "border-2 border-slate-200 text-slate-700 hover:border-indigo-300"
                      }`}
                    >
                      {index === 0 ? "Book now" : "Book"}
                    </button>
                  </div>
                  </div>
                  {index === 0 && (
                    <p className="sm:hidden inline-flex w-fit items-center whitespace-nowrap text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                      ★ Recommended{listed.length > 1 && " · lowest price"}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {listed.length > VISIBLE_OFFERS && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="mt-2 w-full rounded-lg border border-dashed border-indigo-200 py-2 text-sm font-semibold text-indigo-600 hover:bg-white cursor-pointer"
              >
                {showAll ? "Show fewer sellers" : `Show ${listed.length - VISIBLE_OFFERS} more sellers`}
              </button>
            )}
          </>
        )}

        {alternatives.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => shareOnWhatsApp(flight, lowest?.price ?? flight.price)}
              className="font-semibold text-emerald-700 hover:underline cursor-pointer mr-2"
            >
              Share on WhatsApp
            </button>
            <span>Not listed above? Check:</span>
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
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Prices come from Google Flights and can change at checkout. We list sellers by price, not by
          commission.
          {domestic && " Check-in baggage is usually included on Indian domestic economy fares, but fare types differ, so confirm on the seller's site."}
        </p>
      </div>
    </div>
  );
}
