"use client";

import { useState } from "react";
import { Bus } from "@/types/bus";
import { formatPrice } from "@/lib/currency";
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
  onSelect,
  selected = false,
  style,
}: {
  bus: Bus;
  onSelect: (bus: Bus) => void;
  selected?: boolean;
  style?: React.CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const lowSeats = bus.seatsLeft <= 5;

  return (
    <div
      style={style}
      className={`flight-card-enter rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-0.5 ${
        selected
          ? "ring-2 ring-emerald-500 shadow-lg shadow-emerald-100"
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
            <p className="text-lg font-bold text-slate-900">{formatTime(bus.departureTime)}</p>
            <p className="text-xs text-slate-500">{bus.from}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">{formatDuration(bus.durationMinutes)}</p>
            <div className="flex items-center gap-1 my-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              <div className="flex-1 h-px bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-300" />
              <BusIcon className="w-3.5 h-3.5 text-teal-500" />
            </div>
            <p className="text-xs text-slate-400">{bus.seatType}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{formatTime(bus.arrivalTime)}</p>
            <p className="text-xs text-slate-500">{bus.to}</p>
          </div>
        </div>

        <div className="text-sm text-slate-600 sm:w-44">
          <p className="font-semibold text-slate-800">{bus.operator}</p>
          <p className="text-xs flex items-center gap-1">
            <StarIcon className="w-3.5 h-3.5 text-amber-500" /> {bus.rating.toFixed(1)}
          </p>
          <p
            className={`text-xs mt-1 font-medium ${
              lowSeats ? "text-amber-600" : "text-slate-400"
            }`}
          >
            {lowSeats ? `Only ${bus.seatsLeft} seats left` : `${bus.seatsLeft} seats left`}
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:w-32">
          <p className="text-xl font-extrabold gradient-text [--gradient-from:theme(colors.emerald.600)] [--gradient-to:theme(colors.teal.500)]">
            {formatPrice(bus.price)}
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
            <div className="text-sm text-slate-600">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
                <dt className="text-slate-400">Bus number</dt>
                <dd>{bus.busNumber}</dd>
                <dt className="text-slate-400">Seat type</dt>
                <dd>{bus.seatType}</dd>
                <dt className="text-slate-400">Route</dt>
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(bus);
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:shadow-lg hover:shadow-emerald-300/50 active:scale-95 text-white text-sm font-bold rounded-full px-5 py-2.5 transition-all self-start sm:self-auto cursor-pointer"
            >
              Select this bus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
