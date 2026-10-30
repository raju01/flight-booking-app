import { Flight } from "@/types/flight";

// Door to door time. Live fares report it (it includes layovers); otherwise sum the legs.
export function totalDurationMinutes(flight: Flight): number {
  return flight.totalDurationMinutes ?? flight.segments.reduce((sum, s) => sum + s.durationMinutes, 0);
}
