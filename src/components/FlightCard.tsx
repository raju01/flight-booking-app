"use client";

import { useState } from "react";
import { Flight } from "@/types/flight";
import { formatPrice } from "@/lib/currency";
import { ChevronIcon, PlaneIcon } from "@/components/icons";

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
  onSelect,
  selected = false,
  style,
}: {
  flight: Flight;
  onSelect: (flight: Flight) => void;
  selected?: boolean;
  style?: React.CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const segment = flight.segments[0];
  const lowSeats = flight.seatsLeft <= 3;

  return (
    <div
      style={style}
      className={`flight-card-enter rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-0.5 ${
        selected
          ? "ring-2 ring-indigo-500 shadow-lg shadow-indigo-100"
          : "border border-slate-200"
      }`}
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
          <p
            className={`text-xs mt-1 font-medium ${
              lowSeats ? "text-amber-600" : "text-slate-400"
            }`}
          >
            {lowSeats ? `Only ${flight.seatsLeft} seats left` : `${flight.seatsLeft} seats left`}
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:w-32">
          <p className="text-xl font-extrabold gradient-text [--gradient-from:theme(colors.indigo.600)] [--gradient-to:theme(colors.fuchsia.500)]">
            {formatPrice(flight.price)}
          </p>
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

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(flight);
              }}
              className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-lg hover:shadow-violet-300/50 active:scale-95 text-white text-sm font-bold rounded-full px-5 py-2.5 transition-all self-start sm:self-auto cursor-pointer"
            >
              Select this flight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
