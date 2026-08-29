"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AirportAutocomplete from "@/components/AirportAutocomplete";
import { SwapIcon, PlaneIcon } from "@/components/icons";
import { CabinClass } from "@/types/flight";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white/70 transition-colors focus:outline-none focus:border-indigo-400 focus:bg-white";

export default function SearchForm() {
  const router = useRouter();
  const [tripType, setTripType] = useState<"one-way" | "round-trip">("round-trip");
  const [from, setFrom] = useState("DEL");
  const [to, setTo] = useState("BOM");
  const [departDate, setDepartDate] = useState(todayISO());
  const [returnDate, setReturnDate] = useState(todayISO());
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState<CabinClass>("Economy");
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
      departDate,
      passengers: String(passengers),
      cabinClass,
      tripType,
    });
    if (tripType === "round-trip") params.set("returnDate", returnDate);

    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2 text-sm font-semibold">
        {(["round-trip", "one-way"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTripType(type)}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              tripType === type
                ? "bg-indigo-100 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {type === "round-trip" ? "Round trip" : "One way"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <AirportAutocomplete label="From" value={from} onChange={setFrom} excludeCode={to} />
        <button
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          aria-label="Swap origin and destination"
          title="Swap origin and destination"
          className="hidden sm:flex items-center justify-center w-10 h-10 mb-0.5 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:scale-110 hover:rotate-180 transition-all duration-300 cursor-pointer"
        >
          <SwapIcon />
        </button>
        <AirportAutocomplete label="To" value={to} onChange={setTo} excludeCode={from} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Depart</label>
          <input
            type="date"
            value={departDate}
            min={todayISO()}
            onChange={(e) => setDepartDate(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        {tripType === "round-trip" && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Return</label>
            <input
              type="date"
              value={returnDate}
              min={departDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Cabin class</label>
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value as CabinClass)}
            className={`${inputClass} cursor-pointer`}
          >
            {["Economy", "Premium Economy", "Business", "First"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 animate-[shake_0.3s_ease-in-out]">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSearching}
        className="mt-2 bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:shadow-xl hover:shadow-violet-300/50 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-full px-6 py-3.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {isSearching ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Searching…
          </>
        ) : (
          <>
            <PlaneIcon className="w-4 h-4" />
            Search flights
          </>
        )}
      </button>
    </form>
  );
}
