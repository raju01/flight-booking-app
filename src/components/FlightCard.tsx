"use client";

import { useMemo, useState } from "react";
import { Flight } from "@/types/flight";
import { FareTierId } from "@/types/fareTier";
import { generateFareTiers } from "@/lib/fareTiers";
import { formatPrice } from "@/lib/currency";
import { estimateEmissionsKg } from "@/lib/emissions";
import { estimatePriceTrend, priceLockFee, PRICE_LOCK_HOURS } from "@/lib/priceTrend";
import { ChevronIcon, PlaneIcon, LeafIcon, SparkleIcon } from "@/components/icons";

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
  isGreenest = false,
  style,
}: {
  flight: Flight;
  onSelect: (flight: Flight) => void;
  selected?: boolean;
  isGreenest?: boolean;
  style?: React.CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<FareTierId>("saver");
  const [priceLocked, setPriceLocked] = useState(false);
  const segment = flight.segments[0];
  const lowSeats = flight.seatsLeft <= 3;
  const fareTiers = useMemo(() => generateFareTiers(flight.id, flight.price), [flight.id, flight.price]);
  const selectedTier = fareTiers.find((t) => t.id === selectedTierId) ?? fareTiers[0];
  const emissionsKg = useMemo(() => estimateEmissionsKg(flight), [flight]);
  const priceTrend = useMemo(() => estimatePriceTrend(flight), [flight]);
  const lockFee = useMemo(() => priceLockFee(flight.price + selectedTier.priceDelta), [flight.price, selectedTier.priceDelta]);

  function handleSelect() {
    onSelect({
      ...flight,
      price: flight.price + selectedTier.priceDelta + (priceLocked ? lockFee : 0),
      fareTier: selectedTier,
      priceLocked,
    });
  }

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
          <span
            className={`text-[10px] font-bold rounded-full px-2 py-1 flex items-center gap-1 ${
              priceTrend.recommendation === "wait"
                ? "bg-amber-50 text-amber-700"
                : "bg-indigo-50 text-indigo-700"
            }`}
          >
            <SparkleIcon className="w-3 h-3" />
            {priceTrend.recommendation === "wait" ? "AI: price may drop" : "AI: book now"}
          </span>
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

            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Choose your fare</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {fareTiers.map((tier) => {
                  const isSelected = tier.id === selectedTierId;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTierId(tier.id);
                      }}
                      className={`text-left rounded-xl p-3 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white shadow-md shadow-violet-300"
                          : "bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm">{tier.name}</span>
                        <span className="text-xs font-bold">
                          {tier.priceDelta > 0 ? `+${formatPrice(tier.priceDelta)}` : "Included"}
                        </span>
                      </div>
                      <ul className={`text-[11px] space-y-0.5 ${isSelected ? "text-white/90" : "text-slate-500"}`}>
                        <li>
                          Cabin {tier.cabinBaggageKg}kg · Check-in {tier.checkInBaggageKg}kg
                        </li>
                        <li>
                          Cancellation:{" "}
                          {tier.cancellationFee === "free" ? "Free" : `${formatPrice(tier.cancellationFee)} fee`}
                        </li>
                        <li>
                          Date change:{" "}
                          {tier.dateChangeFee === "free" ? "Free" : `${formatPrice(tier.dateChangeFee)} fee`}
                        </li>
                        <li>
                          {tier.seatSelection === "free" ? "Free seat selection" : "Chargeable seat selection"}
                          {tier.mealIncluded ? " · Meal included" : ""}
                        </li>
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`rounded-xl p-3 flex items-start gap-2.5 ${
                priceTrend.recommendation === "wait"
                  ? "bg-amber-50 text-amber-800"
                  : "bg-indigo-50 text-indigo-800"
              }`}
            >
              <SparkleIcon className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed">
                <span className="font-bold">
                  {priceTrend.recommendation === "wait" ? "AI says wait: " : "AI says book now: "}
                </span>
                Prices for this flight look {priceTrend.direction} and could{" "}
                {priceTrend.direction === "rising"
                  ? `rise ~${priceTrend.projectedChangePercent}% soon`
                  : priceTrend.direction === "falling"
                    ? `fall ~${Math.abs(priceTrend.projectedChangePercent)}% soon`
                    : "stay about the same"}
                {" "}({priceTrend.confidencePercent}% confidence, based on historical trends).
              </p>
            </div>

            <label
              className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 p-3 cursor-pointer hover:border-indigo-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={priceLocked}
                  onChange={(e) => setPriceLocked(e.target.checked)}
                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Lock this price for {PRICE_LOCK_HOURS}h
                  </p>
                  <p className="text-xs text-slate-500">
                    Pay {formatPrice(lockFee)} now to freeze the fare while you decide.
                  </p>
                </div>
              </div>
            </label>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Total with <span className="font-semibold text-slate-800">{selectedTier.name}</span>
                {priceLocked ? " + Price Lock" : ""}:{" "}
                <span className="font-extrabold text-slate-900">
                  {formatPrice(flight.price + selectedTier.priceDelta + (priceLocked ? lockFee : 0))}
                </span>
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect();
                }}
                className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-lg hover:shadow-violet-300/50 active:scale-95 text-white text-sm font-bold rounded-full px-5 py-2.5 transition-all self-start sm:self-auto cursor-pointer"
              >
                {priceLocked ? "Lock price" : "Select this flight"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
