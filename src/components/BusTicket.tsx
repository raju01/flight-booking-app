"use client";

import { Bus } from "@/types/bus";
import { Passenger } from "@/types/flight";
import { formatPrice } from "@/lib/currency";
import { BusIcon } from "@/components/icons";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function barcodeBars(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const bars: number[] = [];
  for (let i = 0; i < 40; i++) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    bars.push(1 + (hash % 3));
  }
  return bars;
}

export default function BusTicket({
  bus,
  passengers,
  confirmationCode,
}: {
  bus: Bus;
  passengers: Passenger[];
  confirmationCode: string;
}) {
  const bars = barcodeBars(`${confirmationCode}-${bus.busNumber}`);

  return (
    <div
      id="printable-ticket"
      className="ticket-stub relative bg-white rounded-3xl overflow-hidden shadow-xl shadow-emerald-100 border border-slate-100 flex flex-col sm:flex-row print:shadow-none print:border-slate-300 print:rounded-none print:break-inside-avoid"
    >
      <div className="flex-1 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white">
              <BusIcon className="w-4 h-4" />
            </span>
            <div>
              <p className="font-extrabold text-slate-900 leading-tight">{bus.operator}</p>
              <p className="text-xs text-slate-500">{bus.busNumber}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-1">
            {bus.seatType}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-4">
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{formatTime(bus.departureTime)}</p>
            <p className="text-sm font-semibold text-slate-600">{bus.from}</p>
          </div>
          <div className="flex flex-col items-center px-2">
            <BusIcon className="w-4 h-4 text-teal-500 mb-1" />
            <div className="w-16 sm:w-24 border-t-2 border-dashed border-slate-300" />
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-slate-900">{formatTime(bus.arrivalTime)}</p>
            <p className="text-sm font-semibold text-slate-600">{bus.to}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-dashed border-slate-200 pt-4">
          <div>
            <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Date</p>
            <p className="font-semibold text-slate-800">{formatDate(bus.departureTime)}</p>
          </div>
          <div>
            <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Seat type</p>
            <p className="font-semibold text-slate-800">{bus.seatType}</p>
          </div>
          <div>
            <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Boarding</p>
            <p className="font-semibold text-slate-800">
              Gate {(bus.busNumber.charCodeAt(0) % 12) + 1}
            </p>
          </div>
          <div>
            <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Seat</p>
            <p className="font-semibold text-slate-800">
              {1 + (bus.busNumber.length % 40)}
            </p>
          </div>
        </div>

        {passengers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
            <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-1.5">
              Passenger{passengers.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {passengers.map((p, i) => (
                <p key={i} className="text-sm font-semibold text-slate-800">
                  {p.firstName} {p.lastName}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative sm:w-40 shrink-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 text-white p-5 flex sm:flex-col items-center justify-between sm:justify-center gap-3">
        <div
          className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#faf9ff] print:bg-white"
          aria-hidden
        />
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest opacity-80">Booking ID</p>
          <p className="font-mono font-extrabold text-lg tracking-wider">{confirmationCode}</p>
        </div>
        <div className="flex items-end gap-[1.5px] h-10">
          {bars.map((w, i) => (
            <span key={i} className="bg-white" style={{ width: `${w}px`, height: "100%" }} />
          ))}
        </div>
        <p className="text-xs font-semibold opacity-90">{formatPrice(bus.price)}</p>
      </div>
    </div>
  );
}
