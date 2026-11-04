"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import DatePicker from "@/components/DatePicker";
import HotelDestinationPicker from "@/components/HotelDestinationPicker";
import { HotelIcon } from "@/components/icons";
import { addDays, futureDate } from "@/lib/dates";
import { MAX_HOTEL_ADULTS, MAX_HOTEL_CHILDREN } from "@/lib/hotelCities";

const subscribe = () => () => {};
const MAX_NIGHTS = 30;
const DEFAULT_CHILD_AGE = 8;

const inputClass =
  "w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white text-slate-900 transition-colors focus:outline-none focus:border-amber-400";

export default function HotelSearchForm() {
  const router = useRouter();
  const [place, setPlace] = useState("Goa");
  // Dates are picked in the browser so the prerendered page never offers a day that has passed.
  const today = useSyncExternalStore(subscribe, () => futureDate(0), () => "");
  const maxDate = useSyncExternalStore(subscribe, () => futureDate(330), () => "");
  const [checkInEdit, setCheckIn] = useState<string | null>(null);
  const [checkOutEdit, setCheckOut] = useState<string | null>(null);
  const checkIn = checkInEdit ?? (today && addDays(today, 7));
  const checkOut = checkOutEdit && checkOutEdit > checkIn ? checkOutEdit : checkIn && addDays(checkIn, 2);
  const [openPicker, setOpenPicker] = useState<"in" | "out" | null>(null);
  const [adults, setAdults] = useState(2);
  // One entry per child: its age, which hotels need to price the room.
  const [childAges, setChildAges] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!place.trim() || !checkIn || !checkOut) return;
    setIsSearching(true);
    router.push(
      `/hotel-search?${new URLSearchParams({
        place: place.trim(),
        checkIn,
        checkOut,
        adults: String(adults),
        ...(childAges.length > 0 && { childAges: childAges.join(",") }),
      })}`
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <HotelDestinationPicker value={place} onChange={setPlace} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Check-in</label>
          <DatePicker
            ariaLabel="Check-in date"
            accent="amber"
            value={checkIn}
            min={today}
            max={maxDate}
            rangeStart={checkIn}
            rangeEnd={checkOut}
            open={openPicker === "in"}
            onOpenChange={(open) => setOpenPicker(open ? "in" : null)}
            onChange={(iso) => {
              setCheckIn(iso);
              if (!checkOutEdit || checkOutEdit <= iso || checkOutEdit > addDays(iso, MAX_NIGHTS)) setCheckOut(addDays(iso, 2));
              setOpenPicker("out");
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Check-out</label>
          <DatePicker
            ariaLabel="Check-out date"
            accent="amber"
            value={checkOut}
            min={checkIn && addDays(checkIn, 1)}
            max={checkIn && addDays(checkIn, MAX_NIGHTS)}
            rangeStart={checkIn}
            rangeEnd={checkOut}
            open={openPicker === "out"}
            onOpenChange={(open) => setOpenPicker(open ? "out" : null)}
            onChange={(iso) => {
              setCheckOut(iso);
              setOpenPicker(null);
            }}
            align="right"
          />
        </div>
        <div>
          <label htmlFor="hotel-adults" className="block text-xs font-semibold text-slate-500 mb-1">
            Adults
          </label>
          <select
            id="hotel-adults"
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className={`${inputClass} cursor-pointer`}
          >
            {Array.from({ length: MAX_HOTEL_ADULTS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} adult{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="hotel-children" className="block text-xs font-semibold text-slate-500 mb-1">
            Children
          </label>
          <select
            id="hotel-children"
            value={childAges.length}
            onChange={(e) => {
              const count = Number(e.target.value);
              setChildAges((ages) => Array.from({ length: count }, (_, i) => ages[i] ?? DEFAULT_CHILD_AGE));
            }}
            className={`${inputClass} cursor-pointer`}
          >
            {Array.from({ length: MAX_HOTEL_CHILDREN + 1 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "No children" : `${n} child${n > 1 ? "ren" : ""}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {childAges.length > 0 && (
        <fieldset className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-600">Age of each child at check-in</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {childAges.map((age, i) => (
              <label key={i} className="text-xs font-semibold text-slate-500">
                Child {i + 1}
                <select
                  value={age}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setChildAges((ages) => ages.map((a, j) => (j === i ? next : a)));
                  }}
                  className={`${inputClass} mt-1 cursor-pointer`}
                >
                  {Array.from({ length: 17 }, (_, n) => n + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} year{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <button
        type="submit"
        disabled={isSearching || !today}
        className="mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-xl hover:shadow-orange-300/50 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-full px-6 py-3.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {isSearching ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Searching…
          </>
        ) : (
          <>
            <HotelIcon className="w-4 h-4" />
            Search hotels
          </>
        )}
      </button>
    </form>
  );
}
