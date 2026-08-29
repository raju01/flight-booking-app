"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AirportAutocomplete from "@/components/AirportAutocomplete";
import { SwapIcon, BusIcon } from "@/components/icons";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white/70 transition-colors focus:outline-none focus:border-emerald-400 focus:bg-white";

export default function BusSearchForm() {
  const router = useRouter();
  const [from, setFrom] = useState("DEL");
  const [to, setTo] = useState("JAI");
  const [travelDate, setTravelDate] = useState(todayISO());
  const [passengers, setPassengers] = useState(1);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (from === to) {
      setError("Origin and destination cannot be the same.");
      return;
    }
    setError("");
    setIsSearching(true);

    const params = new URLSearchParams({
      from,
      to,
      travelDate,
      passengers: String(passengers),
    });

    router.push(`/bus-search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <AirportAutocomplete label="From" value={from} onChange={setFrom} excludeCode={to} accent="emerald" />
        <button
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          aria-label="Swap origin and destination"
          title="Swap origin and destination"
          className="hidden sm:flex items-center justify-center w-10 h-10 mb-0.5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200 hover:shadow-lg hover:scale-110 hover:rotate-180 transition-all duration-300 cursor-pointer"
        >
          <SwapIcon />
        </button>
        <AirportAutocomplete label="To" value={to} onChange={setTo} excludeCode={from} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Date of journey
          </label>
          <input
            type="date"
            value={travelDate}
            min={todayISO()}
            onChange={(e) => setTravelDate(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Passengers</label>
          <input
            type="number"
            min={1}
            max={9}
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 animate-[shake_0.3s_ease-in-out]">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSearching}
        className="mt-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:shadow-xl hover:shadow-emerald-300/50 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-full px-6 py-3.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {isSearching ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Searching…
          </>
        ) : (
          <>
            <BusIcon className="w-4 h-4" />
            Search buses
          </>
        )}
      </button>
    </form>
  );
}
