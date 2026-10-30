"use client";

import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/currency";
import { parseISODate } from "@/lib/dates";

export interface DateChange {
  field: "departDate" | "returnDate";
  from: string;
  to: string;
  fromPrice: number | null;
  toPrice: number | null;
}

function format(iso: string): string {
  return (
    parseISODate(iso)?.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) ?? iso
  );
}

// Asks before moving the search to another travel date, so nobody books for a day they did not mean to.
export default function DateChangeDialog({
  change,
  onConfirm,
  onCancel,
}: {
  change: DateChange;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const label = change.field === "returnDate" ? "return" : "departure";
  const difference = change.fromPrice !== null && change.toPrice !== null ? change.toPrice - change.fromPrice : null;

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if (e.key === "Tab") {
      // Keep keyboard focus inside the dialog while it is open.
      const next = e.shiftKey ? document.activeElement === confirmRef.current : document.activeElement === cancelRef.current;
      if (next) {
        e.preventDefault();
        (e.shiftKey ? cancelRef : confirmRef).current?.focus();
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-change-title"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-[fadeInUp_0.18s_ease-out]"
      >
        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
          Different date
        </span>
        <h2 id="date-change-title" className="mt-3 text-xl font-extrabold text-slate-900">
          Change your {label} date?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          You searched for <strong className="text-slate-900">{format(change.from)}</strong>
          {change.fromPrice !== null && <> (from {formatPrice(change.fromPrice)})</>}. If you continue, you will see
          and book flights for <strong className="text-slate-900">{format(change.to)}</strong>
          {change.toPrice !== null && <> (from {formatPrice(change.toPrice)})</>} instead.
        </p>

        {difference !== null && difference !== 0 && (
          <p
            className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
              difference < 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
            }`}
          >
            {formatPrice(Math.abs(difference))} {difference < 0 ? "cheaper" : "more expensive"} than your original date
          </p>
        )}

        <p className="mt-3 text-xs text-slate-500">
          Flights, times and fares are different on every date, so the results will change.
        </p>

        <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-full border-2 border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:border-indigo-300 cursor-pointer"
          >
            Keep {format(change.from).split(",")[0]} {parseISODate(change.from)?.getDate()}{" "}
            {parseISODate(change.from)?.toLocaleDateString("en-IN", { month: "short" })}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white hover:shadow-lg hover:shadow-violet-300/50 cursor-pointer"
          >
            Yes, show {parseISODate(change.to)?.getDate()}{" "}
            {parseISODate(change.to)?.toLocaleDateString("en-IN", { month: "short" })}
          </button>
        </div>
      </div>
    </div>
  );
}
