import type { DataSource } from "@/lib/flightSearch";

export default function DataSourceBadge({
  source,
  liveLabel = "Live fares",
}: {
  source: DataSource;
  liveLabel?: string;
}) {
  if (source === "unavailable") return null;
  return source === "live" ? (
    <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
      {liveLabel}
    </span>
  ) : (
    <span
      title="Live data is unavailable, so these results are generated samples."
      className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200"
    >
      Sample data
    </span>
  );
}
