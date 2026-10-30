import { CabinClass, Flight, PriceInsights } from "@/types/flight";
import { TravelerCounts } from "@/types/traveler";
import { generateMockFlights } from "@/lib/mockFlights";
import { registerAirport } from "@/lib/airports";
import { sampleDataAllowed } from "@/lib/sampleData";
import type { DataSource } from "@/lib/flightSearch";

export type { DataSource };

interface FlightQuery {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
  passengers: number;
  travelers?: TravelerCounts;
  load?: boolean; // fare calendar only: the visitor asked for live prices
}

function toQueryString({ travelers, load, ...query }: FlightQuery) {
  return new URLSearchParams({
    ...query,
    passengers: String(query.passengers),
    ...(load && { load: "1" }),
    ...(travelers && {
      adults: String(travelers.adults),
      children: String(travelers.children),
      infants: String(travelers.infants),
    }),
  }).toString();
}

// Falls back to sample data if the API route itself is unreachable; aborts still reject.
export async function fetchFlights(
  query: FlightQuery,
  signal: AbortSignal
): Promise<{ flights: Flight[]; source: DataSource; insights?: PriceInsights }> {
  try {
    const res = await fetch(`/api/flights?${toQueryString(query)}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as {
      flights: Flight[];
      source: DataSource;
      insights?: PriceInsights;
    };
    for (const flight of body.flights) {
      for (const segment of flight.segments) {
        registerAirport(segment.from);
        registerAirport(segment.to);
      }
    }
    return body;
  } catch (error) {
    if (signal.aborted) throw error;
    return sampleDataAllowed()
      ? { flights: generateMockFlights(query), source: "mock" }
      : { flights: [], source: "unavailable" };
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
