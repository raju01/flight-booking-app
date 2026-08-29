import { Flight, CabinClass } from "@/types/flight";

const CABIN_MULTIPLIER: Record<CabinClass, number> = {
  Economy: 1,
  "Premium Economy": 1.3,
  Business: 2.6,
  First: 3.8,
};

const KG_CO2_PER_MINUTE = 11;
const KG_CO2_PER_STOP = 55;

export function estimateEmissionsKg(flight: Flight): number {
  const flightMinutes = flight.segments.reduce((sum, s) => sum + s.durationMinutes, 0);
  const base = flightMinutes * KG_CO2_PER_MINUTE + flight.stops * KG_CO2_PER_STOP;
  return Math.round(base * CABIN_MULTIPLIER[flight.cabinClass]);
}

export function lowestEmissionsId(flights: Flight[]): string | null {
  if (flights.length === 0) return null;
  let best = flights[0];
  let bestKg = estimateEmissionsKg(best);
  for (const f of flights.slice(1)) {
    const kg = estimateEmissionsKg(f);
    if (kg < bestKg) {
      best = f;
      bestKg = kg;
    }
  }
  return best.id;
}
