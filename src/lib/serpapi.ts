import { CabinClass, Flight, FlightOffer, FlightSegment, PriceInsights } from "@/types/flight";
import { findAirport } from "@/lib/airports";
import { SOLO } from "@/lib/party";
import { TravelerCounts } from "@/types/traveler";
import { createHash } from "node:crypto";
import { getJSON, inBackground, setJSON } from "@/lib/sharedStore";
import { recordFare } from "@/lib/recentFares";

const REQUEST_TIMEOUT_MS = 30000;
// Prices are always fetched live (the owner's choice: a stored price can differ from the seller's checkout),
// so every search and seller lookup spends a SerpApi credit. Identical lookups running at the same moment
// still share one live request. Only the one-traveller price history, used to draw a group's chart, is
// kept for a while, since it is not a price anyone books.
const HISTORY_CACHE_TTL_SECONDS = 6 * 60 * 60;

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
    airline_logo?: string;
    flight_number: string;
  }[];
  price?: number;
  total_duration?: number;
  booking_token?: string;
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

// Short, plain descriptions of what a seller includes (kept as Google words them).
function cleanBaggage(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const lines = raw.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 60)).filter(Boolean);
  return lines.length ? lines.slice(0, 6) : undefined;
}

// Logos are shown straight from Google's image host; anything else is ignored.
function trustedLogo(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "www.gstatic.com" && parsed.pathname.startsWith("/flights/")
      ? parsed.href
      : undefined;
  } catch {
    return undefined;
  }
}

function toFlight(option: SerpOption, cabinClass: CabinClass, travelers: TravelerCounts): Flight | null {
  if (!option.flights?.length || typeof option.price !== "number") return null;

  const segments: FlightSegment[] = option.flights.map((s) => ({
    airline: s.airline,
    flightNumber: s.flight_number.replace(/\s+/g, ""),
    from: toAirport(s.departure_airport),
    to: toAirport(s.arrival_airport),
    departureTime: toLocalIso(s.departure_airport.time),
    arrivalTime: toLocalIso(s.arrival_airport.time),
    durationMinutes: s.duration,
    airlineLogo: trustedLogo(s.airline_logo),
  }));

  const route = `${segments[0].from.code} to ${segments[segments.length - 1].to.code}`;
  const day = segments[0].departureTime.slice(0, 10);
  const bookingUrl = `https://www.google.com/travel/flights?${new URLSearchParams({
    q: `Flights from ${route} on ${day} one way`,
    curr: "INR",
  })}`;

  return {
    bookingUrl,
    totalDurationMinutes: option.total_duration,
    bookingToken: option.booking_token,
    id: `${segments.map((s) => s.flightNumber).join("-")}-${segments[0].departureTime}`,
    stops: segments.length - 1,
    price: option.price,
    currency: "INR",
    cabinClass,
    travelers,
    segments,
  };
}

export interface SerpSearchResult {
  flights: Flight[];
  insights?: PriceInsights;
}

function toInsights(raw: {
  price_level?: string;
  typical_price_range?: number[];
  price_history?: unknown;
} | undefined): PriceInsights | undefined {
  const [typicalLow, typicalHigh] = raw?.typical_price_range ?? [];
  const level = raw?.price_level;
  if ((level !== "low" && level !== "typical" && level !== "high") || typeof typicalLow !== "number" || typeof typicalHigh !== "number") {
    return undefined;
  }
  const history = Array.isArray(raw?.price_history)
    ? raw.price_history.filter(
        (point): point is [number, number] =>
          Array.isArray(point) && typeof point[0] === "number" && typeof point[1] === "number"
      )
    : [];
  return { level, typicalLow, typicalHigh, history: history.length >= 2 ? history : undefined };
}

const searchesInFlight = new Map<string, Promise<SerpSearchResult>>();

// Google reports price history and the usual range for one traveller only. For a group, scale the
// single-traveller figures so the last point is today's real group fare (adults-only groups scale
// exactly; children and infants are picked up by the same ratio).
function scaleInsights(
  party: PriceInsights | undefined,
  solo: PriceInsights | undefined,
  partyLowest: number
): PriceInsights | undefined {
  if (party?.history) return party;
  const soloToday = solo?.history?.[solo.history.length - 1]?.[1];
  if (!solo?.history || !soloToday) return party;
  const factor = partyLowest / soloToday;
  if (!Number.isFinite(factor) || factor <= 0 || factor > 20) return party;
  return {
    level: party?.level ?? solo.level,
    typicalLow: party?.typicalLow ?? Math.round(solo.typicalLow * factor),
    typicalHigh: party?.typicalHigh ?? Math.round(solo.typicalHigh * factor),
    history: solo.history.map(([seconds, price]) => [seconds, Math.round(price * factor)] as [number, number]),
    estimatedForParty: true,
  };
}

export async function searchSerpApiFlights(params: {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
  travelers?: TravelerCounts;
}): Promise<SerpSearchResult> {
  const result = await searchOnce(params);
  const travelers = params.travelers ?? SOLO;
  const isSolo = travelers.adults === 1 && travelers.children === 0 && travelers.infants === 0;
  if (isSolo || result.flights.length === 0 || result.insights?.history) return result;
  // Google gives price history for one traveller only. It is kept for a few hours, so this is at most one
  // extra lookup per route and date.
  const historyKey = `serp-history:v1:${params.from}|${params.to}|${params.date}|${params.cabinClass}`;
  let soloInsights = await getJSON<PriceInsights>(historyKey);
  if (!soloInsights) {
    soloInsights = (await searchOnce({ ...params, travelers: SOLO }).catch(() => null))?.insights ?? null;
    if (soloInsights) inBackground(setJSON(historyKey, soloInsights, HISTORY_CACHE_TTL_SECONDS));
  }
  const partyLowest = Math.min(...result.flights.map((f) => f.price));
  return { ...result, insights: scaleInsights(result.insights, soloInsights ?? undefined, partyLowest) };
}

// Prices are for the whole party (Google returns the total for everyone), so they match what the
// seller charges at checkout.
async function searchOnce(params: {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
  travelers?: TravelerCounts;
}): Promise<SerpSearchResult> {
  const travelers = params.travelers ?? SOLO;
  const key = `serp-search:v1:${params.from}|${params.to}|${params.date}|${params.cabinClass}|${travelers.adults}-${travelers.children}-${travelers.infants}`;
  const pending = searchesInFlight.get(key);
  if (pending) return pending;
  const lookup = requestSearch(params, travelers).finally(() => searchesInFlight.delete(key));
  searchesInFlight.set(key, lookup);
  return lookup;
}

async function requestSearch(
  params: { from: string; to: string; date: string; cabinClass: CabinClass },
  travelers: TravelerCounts
): Promise<SerpSearchResult> {
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
    ...partyQuery(travelers),
    // SerpApi otherwise answers a repeat of the same query from its own one-hour copy; prices must be live.
    no_cache: "true",
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
    price_insights?: { price_level?: string; typical_price_range?: number[]; price_history?: unknown };
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
      .map((option) => toFlight(option, params.cabinClass, travelers))
      .filter((f): f is Flight => f !== null)
      .sort((a, b) => a.price - b.price);
  }

  const result: SerpSearchResult = { flights, insights: toInsights(body.price_insights) };
  const cheapest = flights[0];
  if (cheapest && params.cabinClass === "Economy" && travelers.adults === 1 && travelers.children === 0 && travelers.infants === 0) {
    inBackground(
      recordFare(params.from, params.to, {
        date: params.date,
        price: cheapest.price,
        airline: cheapest.segments[0].airline,
        seenAt: new Date().toISOString(),
      })
    );
  }
  return result;
}

// Google only hands out booking links on its own click-tracking host, so nothing else is accepted.
const GOOGLE_CLICK_URL = "https://www.google.com/travel/clk/";

interface SerpBookingOption {
  together?: {
    book_with?: string;
    airline_logos?: string[];
    baggage_prices?: string[];
    price?: number;
    booking_request?: { url?: string; post_data?: string };
  };
}

// Passenger fields for the Google Flights query; a booking token only works with the same party.
function partyQuery(travelers: TravelerCounts): Record<string, string> {
  return {
    adults: String(travelers.adults),
    ...(travelers.children > 0 && { children: String(travelers.children) }),
    ...(travelers.infants > 0 && { infants_on_lap: String(travelers.infants) }),
  };
}

const offersInFlight = new Map<string, Promise<FlightOffer[]>>();

// Lists every seller Google knows for one flight, cheapest first. This is a second SerpApi credit,
// so the UI only asks when someone opens the comparison. The token is tied to the search that made it.
export function fetchFlightOffers(params: {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
  token: string;
  travelers?: TravelerCounts;
}): Promise<FlightOffer[]> {
  // Tokens are long, so concurrent identical lookups are matched on a digest of the token and the party.
  const party = params.travelers ?? SOLO;
  const key = `serp-offers:v1:${createHash("sha256").update(`${params.token}|${party.adults}-${party.children}-${party.infants}`).digest("hex")}`;
  const pending = offersInFlight.get(key);
  if (pending) return pending;
  const lookup = requestFlightOffers(params).finally(() => offersInFlight.delete(key));
  offersInFlight.set(key, lookup);
  return lookup;
}

async function requestFlightOffers(params: {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
  token: string;
  travelers?: TravelerCounts;
}): Promise<FlightOffer[]> {
  const query = new URLSearchParams({
    engine: "google_flights",
    departure_id: params.from,
    arrival_id: params.to,
    outbound_date: params.date,
    type: "2",
    travel_class: TRAVEL_CLASS[params.cabinClass],
    currency: "INR",
    hl: "en",
    gl: "in",
    ...partyQuery(params.travelers ?? SOLO),
    booking_token: params.token,
    // SerpApi otherwise answers a repeat of the same query from its own one-hour copy; prices must be live.
    no_cache: "true",
    api_key: process.env.SERPAPI_API_KEY ?? "",
  });
  const res = await fetch(`https://serpapi.com/search?${query}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string; booking_options?: SerpBookingOption[] };
  if (body.error) throw new Error(`SerpApi: ${body.error}`);
  if (!res.ok) throw new Error(`SerpApi ${res.status}`);

  const offers: FlightOffer[] = [];
  for (const option of body.booking_options ?? []) {
    const o = option.together;
    const request = o?.booking_request;
    if (!o?.book_with || typeof o.price !== "number" || !request?.url?.startsWith(GOOGLE_CLICK_URL)) continue;
    offers.push({ seller: o.book_with, logo: trustedLogo(o.airline_logos?.[0]), baggage: cleanBaggage(o.baggage_prices), price: o.price, url: request.url, postData: request.post_data ?? "" });
  }
  offers.sort((a, b) => a.price - b.price);
  return offers;
}
