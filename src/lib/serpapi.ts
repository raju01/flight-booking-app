import { CabinClass, Flight, FlightSegment } from "@/types/flight";
import { findAirport } from "@/lib/airports";

const REQUEST_TIMEOUT_MS = 30000;
// Each search spends one SerpApi credit, so repeat searches are served from memory for a while.
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const SEARCH_CACHE_MAX_ENTRIES = 200;

const TRAVEL_CLASS: Record<CabinClass, string> = {
  Economy: "1",
  "Premium Economy": "2",
  Business: "3",
  First: "4",
};

interface SerpAirport {
  name: string;
  id: string;
  time: string; // airport-local "YYYY-MM-DD HH:mm"
}

interface SerpOption {
  flights: {
    departure_airport: SerpAirport;
    arrival_airport: SerpAirport;
    duration: number;
    airline: string;
    flight_number: string;
  }[];
  price?: number;
}

export function isSerpApiConfigured(): boolean {
  return Boolean(process.env.SERPAPI_API_KEY);
}

function toAirport(a: SerpAirport) {
  return findAirport(a.id) ?? { code: a.id, city: a.name, name: a.name };
}

// Keep airport-local wall-clock time so the browser shows the same clock time as the ticket.
function toLocalIso(time: string): string {
  return `${time.replace(" ", "T")}:00`;
}

function toFlight(option: SerpOption, cabinClass: CabinClass): Flight | null {
  if (!option.flights?.length || typeof option.price !== "number") return null;

  const segments: FlightSegment[] = option.flights.map((s) => ({
    airline: s.airline,
    flightNumber: s.flight_number.replace(/\s+/g, ""),
    from: toAirport(s.departure_airport),
    to: toAirport(s.arrival_airport),
    departureTime: toLocalIso(s.departure_airport.time),
    arrivalTime: toLocalIso(s.arrival_airport.time),
    durationMinutes: s.duration,
  }));

  const route = `${segments[0].from.code} to ${segments[segments.length - 1].to.code}`;
  const day = segments[0].departureTime.slice(0, 10);
  const bookingUrl = `https://www.google.com/travel/flights?${new URLSearchParams({
    q: `Flights from ${route} on ${day} one way`,
    curr: "INR",
  })}`;

  return {
    bookingUrl,
    id: `${segments.map((s) => s.flightNumber).join("-")}-${segments[0].departureTime}`,
    stops: segments.length - 1,
    price: option.price,
    currency: "INR",
    cabinClass,
    segments,
  };
}

const searchCache = new Map<string, { at: number; flights: Flight[] }>();

// Prices are per adult: Google Flights is always queried for one passenger.
export async function searchSerpApiFlights(params: {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
}): Promise<Flight[]> {
  const key = `${params.from}|${params.to}|${params.date}|${params.cabinClass}`;
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.at < SEARCH_CACHE_TTL_MS) return cached.flights;

  const query = new URLSearchParams({
    engine: "google_flights",
    departure_id: params.from,
    arrival_id: params.to,
    outbound_date: params.date,
    type: "2", // one way
    travel_class: TRAVEL_CLASS[params.cabinClass],
    currency: "INR",
    hl: "en",
    gl: "in",
    api_key: process.env.SERPAPI_API_KEY ?? "",
  });
  const res = await fetch(`https://serpapi.com/search?${query}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    best_flights?: SerpOption[];
    other_flights?: SerpOption[];
  };

  let flights: Flight[] = [];
  if (body.error) {
    // An empty result is reported as an error string, not an empty list.
    if (!/hasn't returned any results|no results/i.test(body.error)) {
      throw new Error(`SerpApi: ${body.error}`);
    }
  } else if (!res.ok) {
    throw new Error(`SerpApi ${res.status}`);
  } else {
    flights = [...(body.best_flights ?? []), ...(body.other_flights ?? [])]
      .map((option) => toFlight(option, params.cabinClass))
      .filter((f): f is Flight => f !== null)
      .sort((a, b) => a.price - b.price);
  }

  if (searchCache.size >= SEARCH_CACHE_MAX_ENTRIES) {
    searchCache.delete(searchCache.keys().next().value as string);
  }
  searchCache.set(key, { at: Date.now(), flights });
  return flights;
}
