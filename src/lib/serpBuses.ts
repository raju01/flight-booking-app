import { findAirport } from "@/lib/airports";
import { Bus } from "@/types/bus";
import { isSerpApiConfigured } from "@/lib/serpapi";

const REQUEST_TIMEOUT_MS = 30000;
// Bus timetables barely change during a day, so they are kept for six hours.
const SEARCH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SEARCH_CACHE_MAX_ENTRIES = 200;

interface TransportRoute {
  time?: string;
  duration?: string;
  fare?: string;
  changes?: string;
}

interface TransportAnswer {
  type?: string;
  routes?: TransportRoute[];
}

function cityName(code: string): string | null {
  const airport = findAirport(code);
  if (!airport) return null;
  return airport.city.replace(/\s*\([^)]*\)/g, "").trim();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

function parseDuration(value: string): number | null {
  const hours = /(\d+)\s*h/i.exec(value);
  const minutes = /(\d+)\s*m/i.exec(value);
  if (!hours && !minutes) return null;
  return (hours ? Number(hours[1]) : 0) * 60 + (minutes ? Number(minutes[1]) : 0);
}

function parseClock(part: string): { hours: number; minutes: number; nextDay: boolean } | null {
  const match = /(\d{1,2}):(\d{2})\s*(am|pm)/i.exec(part);
  if (!match) return null;
  let hours = Number(match[1]) % 12;
  if (match[3].toLowerCase() === "pm") hours += 12;
  return { hours, minutes: Number(match[2]), nextDay: /\+1/.test(part) };
}

function parseInr(fare: string | undefined): number | null {
  if (!fare || !/₹|inr|rs\.?/i.test(fare)) return null;
  const digits = fare.replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

function toBus(route: TransportRoute, from: string, to: string, date: string, index: number): Bus | null {
  if (!route.time || !route.duration) return null;
  if (route.changes && !/^0\b/.test(route.changes)) return null;

  const [departPart, arrivePart] = route.time.split(/\s+[–-]\s+/);
  const depart = departPart ? parseClock(departPart) : null;
  const arrive = arrivePart ? parseClock(arrivePart) : null;
  const durationMinutes = parseDuration(route.duration);
  if (!depart || !arrive || durationMinutes === null) return null;

  const arriveDate = addDays(date, arrive.nextDay || depart.hours * 60 + depart.minutes > arrive.hours * 60 + arrive.minutes ? 1 : 0);

  return {
    id: `live-${from}-${to}-${date}-${index}-${depart.hours}${depart.minutes}`,
    operator: "Direct bus",
    busNumber: "",
    from,
    to,
    departureTime: `${date}T${pad(depart.hours)}:${pad(depart.minutes)}:00`,
    arrivalTime: `${arriveDate}T${pad(arrive.hours)}:${pad(arrive.minutes)}:00`,
    durationMinutes,
    seatType: null,
    price: parseInr(route.fare),
    currency: "INR",
    seatsLeft: null,
    rating: null,
    amenities: [],
  };
}

const searchCache = new Map<string, { at: number; buses: Bus[] }>();

export async function searchSerpApiBuses(params: { from: string; to: string; date: string }): Promise<Bus[]> {
  const fromCity = cityName(params.from);
  const toCity = cityName(params.to);
  if (!fromCity || !toCity || !isSerpApiConfigured()) {
    throw new Error("Bus search is not configured");
  }

  const key = `${params.from}|${params.to}|${params.date}`;
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.at < SEARCH_CACHE_TTL_MS) return cached.buses;

  const [year, month, day] = params.date.split("-").map(Number);
  const when = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const query = new URLSearchParams({
    engine: "google",
    q: `bus from ${fromCity} to ${toCity} on ${when}`,
    google_domain: "google.co.in",
    gl: "in",
    hl: "en",
    api_key: process.env.SERPAPI_API_KEY ?? "",
  });
  const res = await fetch(`https://serpapi.com/search.json?${query}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    answer_box?: TransportAnswer;
  };
  if (body.error && !/hasn't returned any results|no results/i.test(body.error)) {
    throw new Error(`SerpApi: ${body.error}`);
  }
  if (!res.ok && !body.error) throw new Error(`SerpApi ${res.status}`);

  const routes = body.answer_box?.type === "transport_options" ? (body.answer_box.routes ?? []) : [];
  const buses = routes
    .map((route, index) => toBus(route, fromCity, toCity, params.date, index))
    .filter((bus): bus is Bus => bus !== null)
    .sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));

  if (searchCache.size >= SEARCH_CACHE_MAX_ENTRIES) {
    searchCache.delete(searchCache.keys().next().value as string);
  }
  searchCache.set(key, { at: Date.now(), buses });
  return buses;
}
