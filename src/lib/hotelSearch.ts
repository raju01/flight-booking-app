import { Hotel, HotelOffer } from "@/types/hotel";
import type { DataSource } from "@/lib/flightSearch";
import { isSerpApiConfigured } from "@/lib/serpapi";
import { fetchHotelOffers, searchSerpApiHotels, StaySearch } from "@/lib/serpHotels";
import { stayPlace } from "@/lib/hotelCities";
import { addDays, parseISODate, toISODate, todayInIndia } from "@/lib/dates";

export const MAX_NIGHTS = 30;
export const MAX_GUESTS = 8;

export interface HotelSearchResult {
  source: DataSource; // hotels are never invented, so this is "live" or "unavailable"
  hotels: Hotel[];
  fetchedAt?: string;
}

// Validates a stay request from the query string or a JSON body. Check-in today or later, at most
// MAX_NIGHTS nights and a year ahead.
export function parseStay(get: (key: string) => string | null | undefined): StaySearch | null {
  const place = stayPlace(String(get("city") ?? ""));
  const checkIn = String(get("checkIn") ?? "");
  const checkOut = String(get("checkOut") ?? "");
  const adults = Number(get("adults") ?? "2");
  const start = parseISODate(checkIn);
  const end = parseISODate(checkOut);
  if (!place || !start || !end || !Number.isInteger(adults) || adults < 1 || adults > MAX_GUESTS) return null;
  if (toISODate(start) !== checkIn || toISODate(end) !== checkOut) return null;
  const today = todayInIndia();
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (checkIn < today || nights < 1 || nights > MAX_NIGHTS) return null;
  if (checkIn > addDays(today, 365)) return null;
  return { query: place.query, checkIn, checkOut, adults };
}

export async function searchHotels(stay: StaySearch, fresh = false): Promise<HotelSearchResult> {
  if (!isSerpApiConfigured()) return { source: "unavailable", hotels: [] };
  try {
    return { source: "live", ...(await searchSerpApiHotels(stay, fresh)) };
  } catch (error) {
    console.error("SerpApi hotel search failed:", error);
    return { source: "unavailable", hotels: [] };
  }
}

export async function hotelOffers(stay: StaySearch, token: string, notBefore = 0): Promise<HotelOffer[] | null> {
  if (!isSerpApiConfigured()) return null;
  try {
    return await fetchHotelOffers(stay, token, notBefore);
  } catch (error) {
    console.error("SerpApi hotel price lookup failed:", error);
    return null;
  }
}
