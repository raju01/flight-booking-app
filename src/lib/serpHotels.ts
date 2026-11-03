import { Hotel, HotelOffer, StayKind } from "@/types/hotel";
import { getJSON, inBackground, setJSON } from "@/lib/sharedStore";
import { todayInIndia } from "@/lib/dates";

const REQUEST_TIMEOUT_MS = 30000;
// Hotel rates move slowly compared with flights, and each list or seller lookup is a SerpApi credit.
const CACHE_TTL_SECONDS = 6 * 60 * 60;
const MAX_AMENITIES = 8;

// Google only hands out booking links on its own hotel click host; sponsored "aclk" ads are skipped.
const GOOGLE_HOTEL_CLICK_URL = "https://www.google.com/travel/lodging/clk";

export interface StaySearch {
  query: string; // e.g. "Goa, India"
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  adults: number;
}

interface SerpRate {
  extracted_lowest?: number;
}

interface SerpProperty {
  type?: string;
  name?: string;
  description?: string;
  property_token?: string;
  check_in_time?: string;
  check_out_time?: string;
  rate_per_night?: SerpRate;
  total_rate?: SerpRate;
  extracted_hotel_class?: number;
  overall_rating?: number;
  reviews?: number;
  images?: { thumbnail?: string }[];
  amenities?: unknown;
}

interface SerpHotelPrice {
  source?: string;
  logo?: string;
  link?: string;
  official?: boolean;
  rate_per_night?: SerpRate;
  total_rate?: SerpRate;
  free_cancellation?: boolean;
  free_cancellation_until_date?: string;
}

// Photos and logos are shown straight from Google's image hosts; anything else is ignored.
function trustedImage(url: string | undefined, hosts: string[]): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && hosts.includes(parsed.hostname) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Google words the last free-cancellation day as "Nov 18", and sometimes sends a placeholder such as
// "Jun 15" that cannot be right. Keep it only when it falls between today and check-in.
function cancelDay(raw: string | undefined, checkIn: string): string | undefined {
  const match = /^([A-Z][a-z]{2}) (\d{1,2})$/.exec(raw?.trim() ?? "");
  const month = match ? MONTHS.indexOf(match[1]) : -1;
  if (!match || month < 0) return undefined;
  const year = Number(checkIn.slice(0, 4));
  const iso = (y: number) => `${y}-${String(month + 1).padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  const day = iso(year) <= checkIn ? iso(year) : iso(year - 1);
  return day >= todayInIndia() && day <= checkIn ? match[0] : undefined;
}

const price = (rate: SerpRate | undefined) =>
  typeof rate?.extracted_lowest === "number" && rate.extracted_lowest > 0 ? Math.round(rate.extracted_lowest) : null;

function toHotel(p: SerpProperty): Hotel | null {
  if (!p.name || !p.property_token) return null;
  const kind: StayKind = p.type === "vacation rental" ? "vacation rental" : "hotel";
  return {
    id: p.property_token,
    name: p.name.slice(0, 120),
    kind,
    description: p.description?.slice(0, 240),
    stars: typeof p.extracted_hotel_class === "number" ? p.extracted_hotel_class : null,
    rating: typeof p.overall_rating === "number" ? Math.round(p.overall_rating * 10) / 10 : null,
    reviews: typeof p.reviews === "number" ? p.reviews : null,
    pricePerNight: price(p.rate_per_night),
    totalPrice: price(p.total_rate),
    image: trustedImage(p.images?.[0]?.thumbnail, ["lh3.googleusercontent.com", "lh5.googleusercontent.com"]),
    amenities: Array.isArray(p.amenities)
      ? p.amenities.filter((a): a is string => typeof a === "string").slice(0, MAX_AMENITIES)
      : [],
    checkInTime: p.check_in_time,
    checkOutTime: p.check_out_time,
  };
}

function baseQuery(search: StaySearch): Record<string, string> {
  return {
    engine: "google_hotels",
    q: search.query,
    check_in_date: search.checkIn,
    check_out_date: search.checkOut,
    adults: String(search.adults),
    currency: "INR",
    gl: "in",
    hl: "en",
    api_key: process.env.SERPAPI_API_KEY ?? "",
  };
}

async function serpRequest<T>(query: Record<string, string>): Promise<T> {
  const res = await fetch(`https://serpapi.com/search.json?${new URLSearchParams(query)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (body.error && !/hasn't returned any results|no results/i.test(body.error)) throw new Error(`SerpApi: ${body.error}`);
  if (!res.ok && !body.error) throw new Error(`SerpApi ${res.status}`);
  return body;
}

const inFlight = new Map<string, Promise<unknown>>();

// Identical lookups share one request, and answers are kept in the shared store.
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const lookup = (async () => {
    const hit = await getJSON<T>(key);
    if (hit) return hit;
    const fresh = await load();
    inBackground(setJSON(key, fresh, CACHE_TTL_SECONDS));
    return fresh;
  })().finally(() => inFlight.delete(key));
  inFlight.set(key, lookup);
  return lookup;
}

const searchKey = (s: StaySearch) => `${s.query}|${s.checkIn}|${s.checkOut}|${s.adults}`;

// Up to 20 stays Google lists for the place and dates, cheapest first (unpriced ones last).
export function searchSerpApiHotels(search: StaySearch): Promise<Hotel[]> {
  return cached(`serp-hotels:v1:${searchKey(search)}`, async () => {
    const body = await serpRequest<{ properties?: SerpProperty[] }>(baseQuery(search));
    return (body.properties ?? [])
      .map(toHotel)
      .filter((h): h is Hotel => h !== null)
      .sort((a, b) => (a.pricePerNight ?? Number.MAX_SAFE_INTEGER) - (b.pricePerNight ?? Number.MAX_SAFE_INTEGER));
  });
}

// Every booking site Google lists for one stay, cheapest per night first. A second credit, so the UI
// only asks when someone opens the comparison.
export function fetchHotelOffers(search: StaySearch, token: string): Promise<HotelOffer[]> {
  return cached(`serp-hotel-offers:v1:${searchKey(search)}|${token}`, async () => {
    const body = await serpRequest<{ prices?: SerpHotelPrice[] }>({ ...baseQuery(search), property_token: token });
    const offers: HotelOffer[] = [];
    for (const p of body.prices ?? []) {
      const night = price(p.rate_per_night);
      if (!p.source || night === null || !p.link?.startsWith(GOOGLE_HOTEL_CLICK_URL)) continue;
      offers.push({
        seller: p.source.slice(0, 60),
        logo: trustedImage(p.logo, ["www.gstatic.com"]),
        official: p.official === true,
        pricePerNight: night,
        totalPrice: price(p.total_rate),
        freeCancellation: p.free_cancellation === true,
        cancelUntil: p.free_cancellation === true ? cancelDay(p.free_cancellation_until_date, search.checkIn) : undefined,
        url: p.link,
      });
    }
    return offers.sort((a, b) => a.pricePerNight - b.pricePerNight);
  });
}
