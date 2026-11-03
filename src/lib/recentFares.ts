import { getJSON, setJSON } from "@/lib/sharedStore";
import { todayInIndia } from "@/lib/dates";

// The lowest one-adult economy fare each live search found, per route and travel date. Route pages show
// these as "fares found recently", so they carry real prices without spending extra SerpApi credits.

const TTL_SECONDS = 45 * 24 * 60 * 60;
const MAX_DATES = 60;

export interface SeenFare {
  date: string; // travel date, YYYY-MM-DD
  price: number;
  airline: string;
  seenAt: string; // when the search ran
}

const key = (from: string, to: string) => `recent-fares:v1:${from}-${to}`;

// Upcoming dates only, soonest first.
export async function recentFares(from: string, to: string): Promise<SeenFare[]> {
  const today = todayInIndia();
  const list = (await getJSON<SeenFare[]>(key(from, to))) ?? [];
  return list.filter((f) => f.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

export async function recordFare(from: string, to: string, fare: SeenFare): Promise<void> {
  const others = (await recentFares(from, to)).filter((f) => f.date !== fare.date);
  const list = [...others, fare].sort((a, b) => a.date.localeCompare(b.date)).slice(0, MAX_DATES);
  await setJSON(key(from, to), list, TTL_SECONDS);
}
