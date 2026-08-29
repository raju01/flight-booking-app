"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AirportAutocomplete from "@/components/AirportAutocomplete";
import TravelerSelector from "@/components/TravelerSelector";
import RecentSearches from "@/components/RecentSearches";
import { SwapIcon, PlaneIcon, GripIcon } from "@/components/icons";
import { CabinClass } from "@/types/flight";
import { MultiCityLeg } from "@/types/multiCity";
import { TravelerCounts, totalTravelers } from "@/types/traveler";
import { addSearchHistoryEntry } from "@/lib/searchHistory";
import { SearchHistoryEntry } from "@/types/searchHistory";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white/70 transition-colors focus:outline-none focus:border-indigo-400 focus:bg-white";

type TripType = "one-way" | "round-trip" | "multi-city";

const MIN_LEGS = 2;
const MAX_LEGS = 6;

function emptyLeg(from: string, to: string): MultiCityLeg {
  return { from, to, date: todayISO() };
}

export default function SearchForm() {
  const router = useRouter();
  const [tripType, setTripType] = useState<TripType>("round-trip");
  const [from, setFrom] = useState("DEL");
  const [to, setTo] = useState("BOM");
  const [departDate, setDepartDate] = useState(todayISO());
  const [returnDate, setReturnDate] = useState(todayISO());
  const [travelers, setTravelers] = useState<TravelerCounts>({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState<CabinClass>("Economy");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [legs, setLegs] = useState<MultiCityLeg[]>([
    emptyLeg("DEL", "BOM"),
    emptyLeg("BOM", "BLR"),
  ]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function updateLeg(index: number, field: keyof MultiCityLeg, value: string) {
    setLegs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addLeg() {
    setLegs((prev) => {
      if (prev.length >= MAX_LEGS) return prev;
      const last = prev[prev.length - 1];
      return [...prev, emptyLeg(last.to, "")];
    });
  }

  function removeLeg(index: number) {
    setLegs((prev) => (prev.length <= MIN_LEGS ? prev : prev.filter((_, i) => i !== index)));
  }

  function reorderLegs(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setLegs((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (tripType === "multi-city") {
      for (const leg of legs) {
        if (!leg.from || !leg.to || !leg.date) {
          setError("Please fill in every leg's origin, destination, and date.");
          return;
        }
        if (leg.from === leg.to) {
          setError("Origin and destination cannot be the same for a leg.");
          return;
        }
      }
      setError("");
      setIsSearching(true);

      const params = new URLSearchParams({
        passengers: String(totalTravelers(travelers)),
        adults: String(travelers.adults),
        children: String(travelers.children),
        infants: String(travelers.infants),
        cabinClass,
        tripType,
        legs: JSON.stringify(legs),
      });
      router.push(`/search?${params.toString()}`);
      return;
    }

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
      passengers: String(totalTravelers(travelers)),
      adults: String(travelers.adults),
      children: String(travelers.children),
      infants: String(travelers.infants),
      cabinClass,
      tripType,
    });
    if (tripType === "round-trip") params.set("returnDate", returnDate);

    addSearchHistoryEntry({
      from,
      to,
      departDate,
      returnDate: tripType === "round-trip" ? returnDate : undefined,
      passengers: totalTravelers(travelers),
      cabinClass,
      tripType,
    });

    router.push(`/search?${params.toString()}`);
  }

  function applyHistoryEntry(entry: SearchHistoryEntry) {
    setTripType(entry.tripType);
    setFrom(entry.from);
    setTo(entry.to);
    setDepartDate(entry.departDate);
    if (entry.returnDate) setReturnDate(entry.returnDate);
    setCabinClass(entry.cabinClass);
    setTravelers({ adults: entry.passengers, children: 0, infants: 0 });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2 text-sm font-semibold">
        {(["round-trip", "one-way", "multi-city"] as const).map((type) => (
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
            {type === "round-trip"
              ? "Round trip"
              : type === "one-way"
                ? "One way"
                : "Multi-city"}
          </button>
        ))}
      </div>

      {tripType !== "multi-city" && <RecentSearches onSelect={applyHistoryEntry} />}

      {tripType !== "multi-city" ? (
        <>
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
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Return
                </label>
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
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {legs.map((leg, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => setDraggedIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverIndex !== i) setDragOverIndex(i);
              }}
              onDragLeave={() => setDragOverIndex((cur) => (cur === i ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex !== null) reorderLegs(draggedIndex, i);
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              className={`grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_1fr_auto] gap-3 items-end glass-card rounded-2xl p-3 transition-all ${
                draggedIndex === i ? "opacity-40" : ""
              } ${dragOverIndex === i && draggedIndex !== i ? "ring-2 ring-indigo-400" : ""}`}
            >
              <span
                className="hidden sm:flex items-center justify-center h-10 w-6 text-slate-300 hover:text-indigo-500 cursor-grab active:cursor-grabbing transition-colors"
                title="Drag to reorder"
                aria-label={`Drag to reorder leg ${i + 1}`}
              >
                <GripIcon className="w-4 h-4" />
              </span>
              <AirportAutocomplete
                label={`Leg ${i + 1} · From`}
                value={leg.from}
                onChange={(v) => updateLeg(i, "from", v)}
                excludeCode={leg.to}
              />
              <AirportAutocomplete
                label="To"
                value={leg.to}
                onChange={(v) => updateLeg(i, "to", v)}
                excludeCode={leg.from}
              />
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  value={leg.date}
                  min={i > 0 ? legs[i - 1].date : todayISO()}
                  onChange={(e) => updateLeg(i, "date", e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => removeLeg(i)}
                disabled={legs.length <= MIN_LEGS}
                aria-label={`Remove leg ${i + 1}`}
                className="h-10 px-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer disabled:hover:bg-transparent"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addLeg}
            disabled={legs.length >= MAX_LEGS}
            className="self-start text-sm font-semibold text-indigo-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline cursor-pointer"
          >
            + Add another flight
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TravelerSelector value={travelers} onChange={setTravelers} />
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
