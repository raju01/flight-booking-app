"use client";

import { useState } from "react";
import { Bus } from "@/types/bus";
import { formatPrice } from "@/lib/currency";
import { busBookingLink } from "@/lib/outboundLinks";
import { ChevronIcon, StarIcon, BusIcon } from "@/components/icons";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function BusCard({
  bus,
  style,
}: {
  bus: Bus;
  style?: React.CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const lowSeats = bus.seatsLeft !== null && bus.seatsLeft <= 5;
  const booking = busBookingLink(bus);

  return (
    <div
      style={style}
      className="flight-card-enter rounded-2xl bg-white overflow-hidden border border-slate-200 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-0.5"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer"
      >
        <div className="flex-1 grid grid-cols-3 items-center gap-2">
          <div>
            <p className="text-lg font-bold text-slate-900">{formatTime(bus.departureTime)}</p>
            <p className="text-xs text-slate-500">{bus.from}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">{formatDuration(bus.durationMinutes)}</p>
            <div className="flex items-center gap-1 my-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              <div className="flex-1 h-px bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-300" />
              <BusIcon className="w-3.5 h-3.5 text-teal-500" />
            </div>
            <p className="text-xs text-slate-500">{bus.seatType ?? "Direct"}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{formatTime(bus.arrivalTime)}</p>
            <p className="text-xs text-slate-500">{bus.to}</p>
          </div>
        </div>

        <div className="text-sm text-slate-600 sm:w-44">
          <p className="font-semibold text-slate-800">{bus.operator}</p>
          {bus.rating !== null && (
            <p className="text-xs flex items-center gap-1">
              <StarIcon className="w-3.5 h-3.5 text-amber-500" /> {bus.rating.toFixed(1)}
            </p>
          )}
          {bus.seatsLeft !== null && (
            <p
              className={`text-xs mt-1 font-medium ${
                lowSeats ? "text-amber-600" : "text-slate-500"
              }`}
            >
              {lowSeats ? `Only ${bus.seatsLeft} seats left` : `${bus.seatsLeft} seats left`}
            </p>
          )}
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:w-32">
          <p className="text-xl font-extrabold gradient-text [--gradient-from:theme(colors.emerald.600)] [--gradient-to:theme(colors.teal.500)]">
            {bus.price === null ? "See fare" : formatPrice(bus.price)}
          </p>
          <span className="text-xs text-slate-500 flex items-center gap-1">
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
          {booking.seller} handles payment, ticket, and changes.
        </p>
        <a
          href={booking.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:shadow-lg hover:shadow-emerald-300/50 active:scale-95 text-white text-sm font-bold rounded-full px-5 py-2.5 transition-all"
        >
          {booking.label}
        </a>
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-slate-600">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
                {bus.busNumber && (
                  <>
                    <dt className="text-slate-500">Bus number</dt>
                    <dd>{bus.busNumber}</dd>
                  </>
                )}
                <dt className="text-slate-500">Seat type</dt>
                <dd>{bus.seatType ?? "Not listed"}</dd>
                <dt className="text-slate-500">Route</dt>
                <dd>
                  {bus.from} → {bus.to}
                </dd>
              </dl>
              {bus.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {bus.amenities.map((a) => (
                    <span
                      key={a}
                      className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-0.5"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed sm:max-w-xs">
              SkyBook does not sell this ticket. {booking.seller} takes payment. We may earn a
              commission, which does not change the price.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
