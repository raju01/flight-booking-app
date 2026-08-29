"use client";

import { useMemo } from "react";
import { generateSeatLayout } from "@/lib/seatMap";
import { formatPrice } from "@/lib/currency";
import { CabinClass } from "@/types/flight";
import { Seat } from "@/types/seat";

export default function SeatMap({
  flightId,
  cabinClass,
  selectedSeatId,
  disabledSeatIds,
  onSelect,
}: {
  flightId: string;
  cabinClass: CabinClass;
  selectedSeatId: string | null;
  disabledSeatIds: string[];
  onSelect: (seat: Seat) => void;
}) {
  const layout = useMemo(() => generateSeatLayout(flightId, cabinClass), [flightId, cabinClass]);
  const disabledSet = useMemo(() => new Set(disabledSeatIds), [disabledSeatIds]);

  const seatsByRow = useMemo(() => {
    const map = new Map<number, Seat[]>();
    for (const seat of layout.seats) {
      const list = map.get(seat.row) ?? [];
      list.push(seat);
      map.set(seat.row, list);
    }
    return map;
  }, [layout]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
        <LegendItem swatchClass="bg-white border-2 border-slate-300" label="Available" />
        <LegendItem swatchClass="bg-gradient-to-br from-indigo-600 to-fuchsia-500" label="Selected" />
        <LegendItem swatchClass="bg-slate-200" label="Occupied" />
        <LegendItem swatchClass="bg-amber-100 border-2 border-amber-300" label="Extra legroom" />
      </div>

      <div className="flex flex-col gap-1.5 items-center max-h-96 overflow-y-auto px-2 py-1">
        {Array.from(seatsByRow.entries()).map(([row, seats]) => (
          <div key={row} className="flex items-center gap-1.5">
            <span className="w-5 text-[10px] text-slate-400 text-right shrink-0">{row}</span>
            {seats.map((seat, i) => (
              <div key={seat.id} className="flex items-center">
                {i === layout.aisleAfterColumnIndex + 1 && <div className="w-4" />}
                <SeatButton
                  seat={seat}
                  selected={selectedSeatId === seat.id}
                  disabled={seat.occupied || disabledSet.has(seat.id)}
                  onClick={() => onSelect(seat)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatButton({
  seat,
  selected,
  disabled,
  onClick,
}: {
  seat: Seat;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={`${seat.id}${seat.priceDelta > 0 ? ` · +${formatPrice(seat.priceDelta)}` : ""}`}
      className={`w-7 h-7 rounded-md text-[9px] font-bold flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed ${
        selected
          ? "bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white scale-110 shadow-md shadow-violet-300"
          : disabled
            ? "bg-slate-200 text-slate-400"
            : seat.isExtraLegroom
              ? "bg-amber-100 border-2 border-amber-300 text-amber-700 hover:scale-110"
              : "bg-white border-2 border-slate-300 text-slate-500 hover:border-indigo-400 hover:scale-110"
      }`}
    >
      {seat.column}
    </button>
  );
}

function LegendItem({ swatchClass, label }: { swatchClass: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-3.5 h-3.5 rounded ${swatchClass}`} />
      {label}
    </div>
  );
}
