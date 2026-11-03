"use client";

import { useEffect, useState } from "react";

// "just now", "4 min ago", "2 hrs ago". Prices newer than the last tick count as just now.
function age(iso: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr${hours > 1 ? "s" : ""} ago`;
}

// Says how old the prices on screen are (results are reused for a while to save live lookups) and lets the
// visitor ask for live ones.
export default function PricesChecked({
  fetchedAt,
  onRefresh,
  refreshing,
  error,
  accent = "indigo",
}: {
  fetchedAt: string;
  onRefresh: () => void;
  refreshing: boolean;
  error?: string | null;
  accent?: "indigo" | "amber";
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const button =
    accent === "amber"
      ? "border-amber-300 text-amber-800 hover:bg-amber-50"
      : "border-indigo-200 text-indigo-700 hover:bg-indigo-50";

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
      <span>
        <span aria-hidden className="mr-1">
          🕒
        </span>
        Prices checked <strong className="text-slate-800">{age(fetchedAt, now)}</strong>
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className={`inline-flex items-center gap-1.5 rounded-full border-2 bg-white px-3 py-1 font-bold transition-colors disabled:opacity-60 disabled:cursor-wait cursor-pointer ${button}`}
      >
        <span aria-hidden className={refreshing ? "inline-block animate-spin" : "inline-block"}>
          ↻
        </span>
        {refreshing ? "Getting live prices…" : "Refresh prices"}
      </button>
      {error && (
        <span role="alert" className="text-amber-800">
          {error}
        </span>
      )}
    </div>
  );
}
