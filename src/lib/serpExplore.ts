const REQUEST_TIMEOUT_MS = 30000;
// One lookup covers every destination from an origin and costs one SerpApi credit.
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 100;

export interface ExploreDestination {
  code: string;
  name: string;
  country: string;
  price: number; // round trip, per adult
  startDate: string;
  endDate: string;
  stops: number;
  durationMinutes: number;
  airline: string;
  thumbnail?: string;
}

interface SerpDestination {
  name?: string;
  country?: string;
  destination_airport?: { code?: string };
  start_date?: string;
  end_date?: string;
  flight_price?: number;
  flight_duration?: number;
  number_of_stops?: number;
  airline?: string;
  thumbnail?: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function toDestination(raw: SerpDestination): ExploreDestination | null {
  const code = raw.destination_airport?.code ?? "";
  if (!/^[A-Z]{3}$/.test(code) || !raw.name || typeof raw.flight_price !== "number") return null;
  if (!DATE.test(raw.start_date ?? "") || !DATE.test(raw.end_date ?? "")) return null;
  // Only Google's own image host is passed on to the browser.
  const thumbnail = raw.thumbnail?.startsWith("https://") && new URL(raw.thumbnail).hostname.endsWith("gstatic.com")
    ? raw.thumbnail
    : undefined;
  return {
    code,
    name: raw.name,
    country: raw.country ?? "",
    price: raw.flight_price,
    startDate: raw.start_date as string,
    endDate: raw.end_date as string,
    stops: raw.number_of_stops ?? 0,
    durationMinutes: raw.flight_duration ?? 0,
    airline: raw.airline ?? "",
    thumbnail,
  };
}

const cache = new Map<string, { at: number; destinations: ExploreDestination[] }>();
const inFlight = new Map<string, Promise<ExploreDestination[]>>();

export function fetchExploreDestinations(origin: string): Promise<ExploreDestination[]> {
  const cached = cache.get(origin);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return Promise.resolve(cached.destinations);
  const pending = inFlight.get(origin);
  if (pending) return pending;
  const lookup = requestDestinations(origin).finally(() => inFlight.delete(origin));
  inFlight.set(origin, lookup);
  return lookup;
}

async function requestDestinations(origin: string): Promise<ExploreDestination[]> {
  const query = new URLSearchParams({
    engine: "google_travel_explore",
    departure_id: origin,
    currency: "INR",
    hl: "en",
    gl: "in",
    travel_mode: "1", // flights only
    api_key: process.env.SERPAPI_API_KEY ?? "",
  });
  const res = await fetch(`https://serpapi.com/search?${query}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string; destinations?: SerpDestination[] };
  if (body.error) throw new Error(`SerpApi: ${body.error}`);
  if (!res.ok) throw new Error(`SerpApi ${res.status}`);

  const destinations = (body.destinations ?? [])
    .map(toDestination)
    .filter((d): d is ExploreDestination => d !== null && d.code !== origin)
    .sort((a, b) => a.price - b.price);

  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(origin, { at: Date.now(), destinations });
  return destinations;
}
