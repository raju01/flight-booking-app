"use client";

import { useState } from "react";
import { CabinClass, PriceInsights } from "@/types/flight";
import { TravelerCounts } from "@/types/traveler";
import { describeParty, payingTravelers } from "@/lib/party";
import { formatPrice } from "@/lib/currency";
import PriceHistoryChart from "@/components/PriceHistoryChart";

const STYLES = {
  low: {
    box: "border-emerald-200 bg-emerald-50",
    dot: "bg-emerald-500",
    title: "Prices are low",
    tip: "A good time to book.",
  },
  typical: {
    box: "border-indigo-200 bg-indigo-50",
    dot: "bg-indigo-500",
    title: "Prices are typical",
    tip: "Set a price alert if you can wait for a dip.",
  },
  high: {
    box: "border-rose-200 bg-rose-50",
    dot: "bg-rose-500",
    title: "Prices are high",
    tip: "Try nearby dates or set a price alert.",
  },
} as const;

// Where the lowest fare sits on a bar that runs from half a range below to half a range above the usual range.
function markerPosition(price: number, low: number, high: number): number {
  const span = Math.max(high - low, 1);
  const min = low - span * 0.5;
  const max = high + span * 0.5;
  return Math.min(Math.max(((price - min) / (max - min)) * 100, 2), 98);
}

export interface InsightSearch {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
}

// Price history is only included by Google for one traveller. For a group it is built from the
// single-traveller history, which costs an extra lookup, so it loads when the visitor asks for it.
export default function PriceInsightBanner({
  insights,
  lowestPrice,
  party,
  travelDate,
  search,
}: {
  insights?: PriceInsights;
  lowestPrice: number;
  party: TravelerCounts;
  travelDate?: string;
  search: InsightSearch;
}) {
  const [loaded, setLoaded] = useState<{ status: "idle" | "loading" | "failed"; insights?: PriceInsights }>({
    status: "idle",
  });
  const shown = loaded.insights ?? insights;
  const isGroup = !(party.adults === 1 && party.children === 0 && party.infants === 0);
  const canLoadHistory = isGroup && !shown?.history;

  async function loadHistory() {
    setLoaded({ status: "loading" });
    try {
      const res = await fetch(
        `/api/flights/history?${new URLSearchParams({
          from: search.from,
          to: search.to,
          date: search.date,
          cabinClass: search.cabinClass,
          passengers: String(party.adults + party.children),
          adults: String(party.adults),
          children: String(party.children),
          infants: String(party.infants),
        })}`
      );
      const body = (await res.json()) as { insights: PriceInsights | null };
      setLoaded(body.insights?.history ? { status: "idle", insights: body.insights } : { status: "failed" });
    } catch {
      setLoaded({ status: "failed" });
    }
  }

  const historyButton = canLoadHistory && (
    <div className="mt-3">
      <button
        type="button"
        onClick={loadHistory}
        disabled={loaded.status === "loading"}
        className="rounded-full border-2 border-indigo-200 bg-white px-4 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 cursor-pointer"
      >
        {loaded.status === "loading" ? "Loading price history…" : "Show 60-day price history"}
      </button>
      {loaded.status === "failed" && (
        <span className="ml-3 text-xs text-slate-500">Price history isn&rsquo;t available right now.</span>
      )}
    </div>
  );

  // Groups with children or infants get no range from Google until the history is requested.
  if (!shown) {
    return (
      <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
        <p className="font-bold text-slate-900">How does this fare compare?</p>
        <p className="mt-1 text-sm text-slate-600">
          See whether {formatPrice(lowestPrice)} for {describeParty(party)} is low, typical or high for this route.
        </p>
        {historyButton}
      </div>
    );
  }

  const style = STYLES[shown.level];
  return (
    <div className={`mb-6 rounded-2xl border p-4 ${style.box}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
        <p className="font-bold text-slate-900">{style.title} for this route</p>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Today&rsquo;s lowest fare is <strong>{formatPrice(lowestPrice)}</strong>
        {payingTravelers(party) > 1 && <> for {describeParty(party)}</>}. Flights on this route usually cost{" "}
        {formatPrice(shown.typicalLow)} to {formatPrice(shown.typicalHigh)}. {style.tip}
      </p>
      <div className="relative mt-3 h-2 rounded-full bg-white/70 overflow-hidden" aria-hidden>
        <div className="absolute inset-y-0 left-1/4 right-1/4 rounded-full bg-slate-300" />
        <div
          className={`absolute top-0 h-2 w-2 rounded-full ${style.dot} ring-2 ring-white`}
          style={{ left: `${markerPosition(lowestPrice, shown.typicalLow, shown.typicalHigh)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>Cheaper</span>
        <span>Usual range</span>
        <span>Pricier</span>
      </div>
      <PriceHistoryChart
        insights={shown}
        travelDate={travelDate}
        partyLabel={payingTravelers(party) > 1 ? describeParty(party) : undefined}
      />
      {historyButton}
    </div>
  );
}
