"use client";

import { useState } from "react";
import { lookupFlightStatus } from "@/lib/flightStatus";
import { FlightStatusInfo, FlightStatusState } from "@/types/flightStatus";
import { PlaneIcon } from "@/components/icons";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white/70 transition-colors focus:outline-none focus:border-indigo-400 focus:bg-white";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES: Record<FlightStatusState, { label: string; className: string }> = {
  scheduled: { label: "On time", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  delayed: { label: "Delayed", className: "bg-amber-50 text-amber-700 border-amber-200" },
  departed: { label: "Departed", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  landed: { label: "Landed", className: "bg-slate-100 text-slate-600 border-slate-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
};

export default function FlightStatusPage() {
  const [flightNumber, setFlightNumber] = useState("6E204");
  const [date, setDate] = useState(todayISO());
  const [result, setResult] = useState<FlightStatusInfo | null | undefined>(undefined);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(lookupFlightStatus(flightNumber, date));
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 mb-1">
        <PlaneIcon className="w-6 h-6 text-fuchsia-500" />
        Flight status
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Track real-time status for any IndiGo, Air India, SpiceJet, Vistara, Akasa Air, or Air
        India Express flight.
      </p>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3 mb-8">
        <input
          required
          placeholder="Flight number, e.g. 6E204"
          value={flightNumber}
          onChange={(e) => setFlightNumber(e.target.value)}
          className={`${inputClass} sm:flex-1`}
        />
        <input
          required
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-lg hover:shadow-violet-300/50 text-white font-bold rounded-full px-6 py-2.5 transition-all cursor-pointer whitespace-nowrap"
        >
          Check status
        </button>
      </form>

      {result === null && (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm bg-white/50">
          No flight found for that number. Try a code like 6E204, AI101, SG217, UK932, QP238, or
          IX809.
        </div>
      )}

      {result && (
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <p className="text-lg font-extrabold text-slate-900">
                {result.airline} · {result.flightNumber}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(date).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wide rounded-full px-3 py-1.5 border ${STATUS_STYLES[result.status].className}`}
            >
              {STATUS_STYLES[result.status].label}
              {result.status === "delayed" ? ` · +${result.delayMinutes}m` : ""}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-5">
            <div>
              <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-1">Departure</p>
              <p className="font-bold text-slate-900 text-lg">
                {formatTime(result.estimatedDeparture)}
              </p>
              {result.delayMinutes > 0 && (
                <p className="text-xs text-slate-400 line-through">
                  {formatTime(result.scheduledDeparture)}
                </p>
              )}
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-1">Arrival</p>
              <p className="font-bold text-slate-900 text-lg">
                {formatTime(result.estimatedArrival)}
              </p>
              {result.delayMinutes > 0 && (
                <p className="text-xs text-slate-400 line-through">
                  {formatTime(result.scheduledArrival)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm border-t border-dashed border-slate-200 pt-4">
            <div>
              <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Terminal</p>
              <p className="font-semibold text-slate-800">{result.terminal}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Gate</p>
              <p className="font-semibold text-slate-800">{result.gate}</p>
            </div>
            {result.baggageBelt && (
              <div>
                <p className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">
                  Baggage belt
                </p>
                <p className="font-semibold text-slate-800">{result.baggageBelt}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
