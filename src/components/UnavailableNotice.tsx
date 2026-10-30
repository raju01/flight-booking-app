"use client";

// Shown instead of results when live data can't be fetched. Never fills the gap with invented fares.
export default function UnavailableNotice({
  what = "fares",
  className = "",
}: {
  what?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/60 p-8 text-center ${className}`}
    >
      <p className="font-bold text-slate-900">Live {what} are temporarily unavailable</p>
      <p className="mt-1 text-sm text-slate-600">
        We couldn&rsquo;t reach our data provider just now. Please try again in a little while.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 rounded-full border-2 border-amber-300 bg-white px-5 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100 cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
