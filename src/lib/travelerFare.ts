import { TravelerType } from "@/types/traveler";

const FARE_RATE: Record<TravelerType, number> = {
  adult: 1,
  child: 0.9,
  infant: 0.1,
};

export function travelerFare(basePrice: number, type: TravelerType): number {
  return Math.round((basePrice * FARE_RATE[type]) / 10) * 10;
}

export function hasOwnSeat(type: TravelerType): boolean {
  return type !== "infant";
}
