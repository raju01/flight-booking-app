import { Flight } from "@/types/flight";
import { seededRandom, seedFromString } from "@/lib/seededRandom";

/**
 * Flights only carry a single segment with total duration already inflated
 * for stops, so there's no real per-leg breakdown to filter on. This derives
 * a deterministic, plausible layover length (45-165 min) from the flight id
 * for 1-stop flights only, purely for filtering/display purposes.
 */
export function layoverMinutes(flight: Flight): number | null {
  if (flight.stops < 1) return null;
  const rand = seededRandom(seedFromString(`layover-${flight.id}`));
  return 45 + Math.floor(rand() * 120);
}
