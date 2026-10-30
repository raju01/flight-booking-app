import { Bus } from "@/types/bus";
import { generateMockBuses } from "@/lib/mockBuses";
import { isSerpApiConfigured } from "@/lib/serpapi";
import { searchSerpApiBuses } from "@/lib/serpBuses";
import { sampleDataAllowed } from "@/lib/sampleData";
import type { DataSource } from "@/lib/flightSearch";

export interface BusSearchResult {
  source: DataSource;
  buses: Bus[];
}

export async function searchBuses(params: { from: string; to: string; date: string }): Promise<BusSearchResult> {
  const fallback = (): BusSearchResult =>
    sampleDataAllowed() ? { source: "mock", buses: generateMockBuses(params) } : { source: "unavailable", buses: [] };
  if (!isSerpApiConfigured()) return fallback();
  try {
    return { source: "live", buses: await searchSerpApiBuses(params) };
  } catch (error) {
    console.error("SerpApi bus search failed:", error);
    return fallback();
  }
}
