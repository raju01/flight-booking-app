import { CabinClass, Flight } from "@/types/flight";
import { generateMockFlights } from "@/lib/mockFlights";
import { registerAirport } from "@/lib/airports";
import type { DataSource } from "@/lib/flightSearch";

export type { DataSource };

interface FlightQuery {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
  passengers: number;
}

function toQueryString(query: FlightQuery) {
  return new URLSearchParams({ ...query, passengers: String(query.passengers) }).toString();
}

// Falls back to sample data if the API route itself is unreachable; aborts still reject.
export async function fetchFlights(
  query: FlightQuery,
  signal: AbortSignal
): Promise<{ flights: Flight[]; source: DataSource }> {
  try {
    const res = await fetch(`/api/flights?${toQueryString(query)}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { flights: Flight[]; source: DataSource };
    for (const flight of body.flights) {
      for (const segment of flight.segments) {
        registerAirport(segment.from);
        registerAirport(segment.to);
      }
    }
    return body;
  } catch (error) {
    if (signal.aborted) throw error;
    return { flights: generateMockFlights(query), source: "mock" };
  }
}

export async function fetchFareCalendar(
  query: FlightQuery,
  signal: AbortSignal
): Promise<{ days: { date: string; price: number | null }[]; source: DataSource } | null> {
  try {
    const res = await fetch(`/api/fare-calendar?${toQueryString(query)}`, { signal });
    return res.ok ? await res.json() : null;
  } catch (error) {
    if (signal.aborted) throw error;
    return null;
  }
}
