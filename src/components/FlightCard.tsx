"use client";

import { useMemo, useState } from "react";
import { Flight } from "@/types/flight";
import { formatPrice } from "@/lib/currency";
import { estimateEmissionsKg } from "@/lib/emissions";
import { flightBookingLinks } from "@/lib/outboundLinks";
import FareCompare from "@/components/FareCompare";
import { ChevronIcon, PlaneIcon, LeafIcon } from "@/components/icons";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function FlightCard({
  flight,
  isGreenest = false,
  autoCompare = false,
  style,
}: {
  flight: Flight;
  isGreenest?: boolean;
  autoCompare?: boolean;
  style?: React.CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comparing, setComparing] = useState(autoCompare);
  const segment = flight.segments[0];
  const lowSeats = flight.seatsLeft !== undefined && flight.seatsLeft <= 3;
  const emissionsKg = useMemo(() => estimateEmissionsKg(flight), [flight]);
  const { primary, secondary } = flightBookingLinks(flight);

  return (
    <div
      style={style}
      className="flight-card-enter rounded-2xl bg-white overflow-hidden border border-slate-200 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-0.5"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer"
      >
        <div className="flex-1 grid grid-cols-3 items-center gap-2">
          <div>
            <p className="text-lg font-bold text-slate-900">{formatTime(segment.departureTime)}</p>
            <p className="text-xs text-slate-500">{segment.from.code}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">{formatDuration(segment.durationMinutes)}</p>
            <div className="flex items-center gap-1 my-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
              <div className="flex-1 h-px bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-indigo-300" />
              <PlaneIcon className="w-3.5 h-3.5 text-fuchsia-400 rotate-90" />
            </div>
            <p className="text-xs text-slate-400">
              {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}
            </p>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{formatTime(segment.arrivalTime)}</p>
            <p className="text-xs text-slate-500">{segment.to.code}</p>
          </div>
        </div>

        <div className="text-sm text-slate-600 sm:w-40">
          <p className="font-semibold text-slate-800">{segment.airline}</p>
          <p className="text-xs">{segment.flightNumber}</p>
          {flight.seatsLeft !== undefined && (
            <p
              className={`text-xs mt-1 font-medium ${
                lowSeats ? "text-amber-600" : "text-slate-400"
              }`}
            >
              {lowSeats ? `Only ${flight.seatsLeft} seats left` : `${flight.seatsLeft} seats left`}
            </p>
          )}
          <p
            className={`text-xs mt-1 flex items-center gap-1 font-medium ${
              isGreenest ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            <LeafIcon className="w-3 h-3" />
            {emissionsKg}kg CO₂{isGreenest ? " · Greener choice" : ""}
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:w-36">
          <div className="text-right sm:text-right">
            <p className="text-[10px] text-slate-400 font-medium">from</p>
            <p className="text-xl font-extrabold gradient-text [--gradient-from:theme(colors.indigo.600)] [--gradient-to:theme(colors.fuchsia.500)]">
              {formatPrice(flight.price)}
            </p>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            details
            <ChevronIcon
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </span>
        </div>
      </button>

      <div className="px-4 sm:px-5 pb-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-500">
          {flight.bookingToken
            ? "Compare sellers first, then book with the one you pick."
            : `${primary.seller} handles payment, ticket, and changes.`}
        </p>
        <div className="flex flex-wrap gap-2">
          {flight.bookingToken ? (
            <button
              type="button"
              onClick={() => setComparing((v) => !v)}
              aria-expanded={comparing}
              className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-lg hover:shadow-violet-300/50 active:scale-95 text-white text-sm font-bold rounded-full px-5 py-2.5 transition-all cursor-pointer"
            >
              {comparing ? "Hide prices" : "Compare prices"}
            </button>
          ) : (
            <a
              href={primary.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-lg hover:shadow-violet-300/50 active:scale-95 text-white text-sm font-bold rounded-full px-5 py-2.5 transition-all"
            >
              {primary.label}
            </a>
          )}
          {!flight.bookingToken && secondary && (
            <a
              href={secondary.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="border-2 border-slate-200 bg-white hover:border-indigo-300 text-slate-700 text-sm font-bold rounded-full px-5 py-2.5 transition-all"
            >
              {secondary.label}
            </a>
          )}
        </div>
      </div>

      {comparing && flight.bookingToken && (
        <FareCompare flight={flight} alternatives={[primary, ...(secondary ? [secondary] : [])]} />
      )}

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 pt-3 flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600">
              <dt className="text-slate-400">Aircraft</dt>
              <dd>{segment.airline} fleet</dd>
              <dt className="text-slate-400">Cabin</dt>
              <dd>{flight.cabinClass}</dd>
              <dt className="text-slate-400">Flight</dt>
              <dd>{segment.flightNumber}</dd>
              <dt className="text-slate-400">Route</dt>
              <dd>
                {segment.from.city} → {segment.to.city}
              </dd>
            </dl>
            <p className="text-xs text-slate-500 leading-relaxed">
              SkyBook does not sell this ticket. {primary.seller} takes payment and issues the
              ticket. Changes and refunds are handled there. We may earn a commission, which does
              not change the price. Confirm the final fare and baggage rules before you pay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
