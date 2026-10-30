import { TravelerCounts } from "@/types/traveler";

export const SOLO: TravelerCounts = { adults: 1, children: 0, infants: 0 };

// Lap infants fly free of a seat fare, so the fare is shared by adults and children only.
export function payingTravelers(travelers: TravelerCounts | undefined): number {
  return travelers ? Math.max(travelers.adults + travelers.children, 1) : 1;
}

export function perPerson(total: number, travelers: TravelerCounts | undefined): number {
  return Math.round(total / payingTravelers(travelers));
}

export function describeParty(travelers: TravelerCounts | undefined): string {
  if (!travelers) return "1 traveller";
  const count = travelers.adults + travelers.children + travelers.infants;
  return `${count} traveller${count === 1 ? "" : "s"}`;
}

// Counts read from query strings or request bodies, clamped to what airlines accept.
export function parseTravelers(read: (key: string) => unknown, fallbackAdults = 1): TravelerCounts {
  const int = (key: string, fallback: number, min: number, max: number) => {
    const value = Number(read(key));
    return Number.isFinite(value) && read(key) !== null && read(key) !== undefined && read(key) !== ""
      ? Math.min(Math.max(Math.floor(value), min), max)
      : fallback;
  };
  const adults = int("adults", Math.min(Math.max(fallbackAdults, 1), 9), 1, 9);
  const children = Math.min(int("children", 0, 0, 8), 9 - adults);
  const infants = Math.min(int("infants", 0, 0, 8), adults); // one lap infant per adult
  return { adults, children, infants };
}
