import { Flight } from "@/types/flight";
import { seededRandom, seedFromString } from "@/lib/seededRandom";

export type PriceTrendDirection = "rising" | "falling" | "stable";

export interface PriceTrendInfo {
  direction: PriceTrendDirection;
  confidencePercent: number;
  recommendation: "book" | "wait";
  projectedChangePercent: number;
}

export function estimatePriceTrend(flight: Flight): PriceTrendInfo {
  const rand = seededRandom(seedFromString(`trend-${flight.id}`));
  const roll = rand();

  let direction: PriceTrendDirection;
  if (roll < 0.45) direction = "rising";
  else if (roll < 0.8) direction = "stable";
  else direction = "falling";

  const projectedChangePercent =
    direction === "rising"
      ? 4 + Math.round(rand() * 14)
      : direction === "falling"
        ? -(2 + Math.round(rand() * 10))
        : Math.round((rand() - 0.5) * 4);

  const confidencePercent = 65 + Math.floor(rand() * 26);
  const recommendation: "book" | "wait" = direction === "falling" ? "wait" : "book";

  return { direction, confidencePercent, recommendation, projectedChangePercent };
}

const LOCK_FEE_RATE = 0.03;
const LOCK_MIN_FEE = 149;
export const PRICE_LOCK_HOURS = 48;

export function priceLockFee(price: number): number {
  return Math.max(LOCK_MIN_FEE, Math.round((price * LOCK_FEE_RATE) / 10) * 10);
}
