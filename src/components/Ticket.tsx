"use client";

import { Flight, Passenger } from "@/types/flight";
import { SeatSelectionMap } from "@/types/seat";
import { formatPrice } from "@/lib/currency";
import { PlaneIcon } from "@/components/icons";
import RouteMap from "@/components/RouteMap";

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

function TicketStub({
  flight,
  label,
  passengers,
  confirmationCode,
  seatIds,
}: {
  flight: Flight;
  label: string;
  passengers: Passenger[];
  confirmationCode: string;
  seatIds?: (string | undefined)[];
}) {
  const segment = flight.segments[0];
  const bars = barcodeBars(`${confirmationCode}-${segment.flightNumber}`);
  const primarySeat = seatIds?.[0];

  return (
    <div className="ticket-stub relative bg-white rounded-3xl overflow-hidden shadow-xl shadow-indigo-100 border border-slate-100 flex flex-col sm:flex-row print:shadow-none print:border-slate-300 print:rounded-none print:break-inside-avoid">
      <div className="flex-1 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white">
              <PlaneIcon className="w-4 h-4" />
            </span>
            <div>
              <p className="font-extrabold text-slate-900 leading-tight">{segment.airline}</p>
              <p className="text-xs text-slate-500">{segment.flightNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {flight.fareTier && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-600 bg-fuchsia-50 rounded-full px-2.5 py-1">
                {flight.fareTier.name}
              </span>
            )}
            {flight.priceLocked && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 rounded-full px-2.5 py-1">
                Price locked
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1">
              {label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-4">
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{formatTime(segment.departureTime)}</p>
            <p className="text-sm font-semibold text-slate-600">{segment.from.code}</p>
            <p className="text-xs text-slate-400">{segment.from.city}</p>
          </div>
          <div className="flex flex-col items-center px-2">
            <PlaneIcon className="w-4 h-4 text-fuchsia-400 rotate-90 mb-1" />
            <div className="w-16 sm:w-24 border-t-2 border-dashed border-slate-300" />
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-slate-900">{formatTime(segment.arrivalTime)}</p>
            <p className="text-sm font-semibold text-slate-600">{segment.to.code}</p>
            <p className="text-xs text-slate-400">{segment.to.city}</p>
          </div>
        </div>

        <div className="mb-4 print:hidden">
          <RouteMap from={segment.from} to={segment.to} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-dashed border-slate-200 pt-4">
          <div>
            <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Date</p>
            <p className="font-semibold text-slate-800">{formatDate(segment.departureTime)}</p>
          </div>
          <div>
            <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Cabin</p>
            <p className="font-semibold text-slate-800">{flight.cabinClass}</p>
          </div>
          <div>
            <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Gate</p>
            <p className="font-semibold text-slate-800">
              {String.fromCharCode(65 + (segment.flightNumber.length % 6))}
              {(segment.flightNumber.charCodeAt(segment.flightNumber.length - 1) % 30) + 1}
            </p>
          </div>
          <div>
            <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Seat</p>
            <p className="font-semibold text-slate-800">
              {primarySeat ??
                `${12 + (segment.flightNumber.length % 20)}${String.fromCharCode(
                  65 + (segment.flightNumber.charCodeAt(0) % 6)
                )}`}
            </p>
          </div>
        </div>

        {flight.fareTier && (
          <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex flex-wrap gap-x-6 gap-y-1 text-xs">
            <div>
              <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Baggage</p>
              <p className="font-semibold text-slate-800">
                Cabin {flight.fareTier.cabinBaggageKg}kg · Check-in {flight.fareTier.checkInBaggageKg}kg
              </p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Cancellation</p>
              <p className="font-semibold text-slate-800">
                {flight.fareTier.cancellationFee === "free"
                  ? "Free"
                  : `${formatPrice(flight.fareTier.cancellationFee)} fee`}
              </p>
            </div>
          </div>
        )}

        {passengers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
            <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-1.5">
              Passenger{passengers.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {passengers.map((p, i) => (
                <p key={i} className="text-sm font-semibold text-slate-800">
                  {p.firstName} {p.lastName}
                  {p.travelerType !== "adult" && (
                    <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 rounded-full px-1.5 py-0.5">
                      {p.travelerType}
                    </span>
                  )}
                  {seatIds?.[i] && (
                    <span className="ml-1.5 text-xs font-medium text-indigo-600">
                      Seat {seatIds[i]}
                    </span>
                  )}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative sm:w-40 shrink-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 text-white p-5 flex sm:flex-col items-center justify-between sm:justify-center gap-3">
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
        <p className="text-xs font-semibold opacity-90">{formatPrice(flight.price)}</p>
      </div>
    </div>
  );
}

export default function Ticket({
  outbound,
  returnFlight,
  legs,
  passengers,
  confirmationCode,
  seatSelections,
}: {
  outbound?: Flight;
  returnFlight?: Flight | null;
  legs?: Flight[];
  passengers: Passenger[];
  confirmationCode: string;
  seatSelections?: SeatSelectionMap;
}) {
  const stubs: { flight: Flight; label: string }[] = legs
    ? legs.map((flight, i) => ({ flight, label: `Flight ${i + 1}` }))
    : outbound
      ? [
          { flight: outbound, label: returnFlight ? "Outbound" : "Boarding pass" },
          ...(returnFlight ? [{ flight: returnFlight, label: "Return" }] : []),
        ]
      : [];

  return (
    <div id="printable-ticket" className="flex flex-col gap-4">
      {stubs.map(({ flight, label }, legIndex) => (
        <TicketStub
          key={legIndex}
          flight={flight}
          label={label}
          passengers={passengers}
          confirmationCode={confirmationCode}
          seatIds={passengers.map((_, p) => seatSelections?.[`${legIndex}-${p}`])}
        />
      ))}
    </div>
  );
}
