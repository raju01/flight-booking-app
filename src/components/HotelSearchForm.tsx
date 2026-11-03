"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import DatePicker from "@/components/DatePicker";
import AirportAutocomplete from "@/components/AirportAutocomplete";
import { HotelIcon } from "@/components/icons";
import { addDays, futureDate } from "@/lib/dates";

const subscribe = () => () => {};
const MAX_NIGHTS = 30;
const MAX_GUESTS = 8;

const inputClass =
  "w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 bg-white text-slate-900 transition-colors focus:outline-none focus:border-amber-400";

export default function HotelSearchForm() {
  const router = useRouter();
  const [city, setCity] = useState("GOI");
  // Dates are picked in the browser so the prerendered page never offers a day that has passed.
  const today = useSyncExternalStore(subscribe, () => futureDate(0), () => "");
  const maxDate = useSyncExternalStore(subscribe, () => futureDate(330), () => "");
  const [checkInEdit, setCheckIn] = useState<string | null>(null);
  const [checkOutEdit, setCheckOut] = useState<string | null>(null);
  const checkIn = checkInEdit ?? (today && addDays(today, 7));
  const checkOut = checkOutEdit && checkOutEdit > checkIn ? checkOutEdit : checkIn && addDays(checkIn, 2);
  const [openPicker, setOpenPicker] = useState<"in" | "out" | null>(null);
  const [guests, setGuests] = useState(2);
  const [isSearching, setIsSearching] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city || !checkIn || !checkOut) return;
    setIsSearching(true);
    router.push(`/hotel-search?${new URLSearchParams({ city, checkIn, checkOut, adults: String(guests) })}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <AirportAutocomplete label="City or destination" value={city} onChange={setCity} accent="amber" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <label htmlFor="hotel-guests" className="block text-xs font-semibold text-slate-500 mb-1">
            Guests
          </label>
          <select
            id="hotel-guests"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className={`${inputClass} cursor-pointer`}
          >
            {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} adult{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

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
