import { PriceInsights } from "@/types/flight";
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

export default function PriceInsightBanner({
  insights,
  lowestPrice,
}: {
  insights: PriceInsights;
  lowestPrice: number;
}) {
  const style = STYLES[insights.level];
  return (
    <div className={`mb-6 rounded-2xl border p-4 ${style.box}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
        <p className="font-bold text-slate-900">{style.title} for this route</p>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Today&rsquo;s lowest fare is <strong>{formatPrice(lowestPrice)}</strong>. Flights on this route
        usually cost {formatPrice(insights.typicalLow)} to {formatPrice(insights.typicalHigh)}.{" "}
        {style.tip}
      </p>
      <div className="relative mt-3 h-2 rounded-full bg-white/70 overflow-hidden" aria-hidden>
        <div className="absolute inset-y-0 left-1/4 right-1/4 rounded-full bg-slate-300" />
        <div
          className={`absolute top-0 h-2 w-2 rounded-full ${style.dot} ring-2 ring-white`}
          style={{ left: `${markerPosition(lowestPrice, insights.typicalLow, insights.typicalHigh)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>Cheaper</span>
        <span>Usual range</span>
        <span>Pricier</span>
      </div>
      <PriceHistoryChart insights={insights} />
    </div>
  );
}
