"use client";

import { useRef, useState } from "react";
import { PriceInsights } from "@/types/flight";
import { formatPrice } from "@/lib/currency";
import { parseISODate } from "@/lib/dates";

// Timestamps are midnight India time, so format them there whatever the visitor's timezone.
function formatDay(seconds: number): string {
  return new Date(seconds * 1000).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

const PAD = 8; // vertical padding, in percent of the chart height

// Daily lowest fare for the route with the usual range shaded behind it. Drag across it (mouse, touch
// or arrow keys) to read the fare for any day.
export default function PriceHistoryChart({
  insights,
  travelDate,
  partyLabel,
}: {
  insights: PriceInsights;
  travelDate?: string;
  partyLabel?: string;
}) {
  const trip = travelDate
    ? parseISODate(travelDate)?.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : undefined;
  const history = insights.history;
  const areaRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  if (!history) return null;

  const last = history.length - 1;
  const prices = history.map(([, price]) => price);
  const min = Math.min(...prices, insights.typicalLow);
  const max = Math.max(...prices, insights.typicalHigh);
  const span = Math.max(max - min, 1);
  const xPercent = (i: number) => (i / last) * 100;
  const yPercent = (price: number) => PAD + (1 - (price - min) / span) * (100 - PAD * 2);
  const days = Math.round((history[last][0] - history[0][0]) / 86400);

  const shown = active ?? last;
  const [seconds, price] = history[shown];
  const latest = history[last][1];
  const diff = price - latest;

  const line = history
    .map(([, p], i) => `${i === 0 ? "M" : "L"}${xPercent(i).toFixed(2)} ${yPercent(p).toFixed(2)}`)
    .join(" ");

  function scrub(clientX: number) {
    const box = areaRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const ratio = Math.min(Math.max((clientX - box.left) / box.width, 0), 1);
    setActive(Math.round(ratio * last));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const step = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (step) setActive(Math.min(Math.max(shown + step, 0), last));
    else return;
    e.preventDefault();
  }

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-700">
          {active === null
            ? `Lowest fare seen each day, last ${days} days`
            : `On ${formatDay(seconds)}${shown === last ? " (today)" : ""}`}
        </span>
        <span className="text-slate-600">
          {active === null ? (
            <>
              {formatPrice(Math.min(...prices))} – {formatPrice(Math.max(...prices))}
            </>
          ) : (
            <>
              the {trip ? `${trip} ` : ""}fare{partyLabel ? ` for ${partyLabel}` : ""} was <strong className="text-slate-900">{formatPrice(price)}</strong>
              {shown !== last && (
                <span className={diff < 0 ? "text-emerald-700" : "text-rose-700"}>
                  {" "}
                  ({diff < 0 ? "−" : "+"}
                  {formatPrice(Math.abs(diff))} vs today)
                </span>
              )}
            </>
          )}
        </span>
      </div>

      <div
        ref={areaRef}
        role="slider"
        tabIndex={0}
        aria-label="Price history. Use the arrow keys or drag to see the fare on each day."
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={shown}
        aria-valuetext={`${formatDay(seconds)}: ${formatPrice(price)}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          scrub(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId) || e.pointerType === "mouse") scrub(e.clientX);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setActive(null);
        }}
        onPointerUp={(e) => {
          if (e.pointerType !== "mouse") setActive(null);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => setActive(null)}
        className="relative mt-2 h-24 w-full cursor-crosshair select-none touch-none rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <rect
            x="0"
            width="100"
            y={yPercent(insights.typicalHigh)}
            height={Math.max(yPercent(insights.typicalLow) - yPercent(insights.typicalHigh), 0.5)}
            className="fill-slate-300/50"
          />
          <path d={line} fill="none" strokeWidth="1.8" vectorEffect="non-scaling-stroke" className="stroke-slate-700" />
        </svg>

        {/* Cursor and dot are plain elements so the stretched SVG cannot squash them. */}
        <div
          aria-hidden
          className={`absolute inset-y-0 w-px bg-indigo-400 ${active === null ? "opacity-0" : "opacity-100"}`}
          style={{ left: `${xPercent(shown)}%` }}
        />
        <div
          aria-hidden
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 ring-2 ring-white"
          style={{ left: `${xPercent(shown)}%`, top: `${yPercent(price)}%` }}
        />
      </div>

      {insights.estimatedForParty && (
        <p className="mt-1 text-[10px] text-slate-500">
          Estimated for your group from the single-traveller fare history. Today&rsquo;s fare is exact.
        </p>
      )}
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>{formatDay(history[0][0])}</span>
        <span>{active === null ? "Drag to see how the fare for your trip changed" : ""}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
