import { Bus } from "@/types/bus";
import { generateMockBuses } from "@/lib/mockBuses";
import { isSerpApiConfigured } from "@/lib/serpapi";
import { searchSerpApiBuses } from "@/lib/serpBuses";
import type { DataSource } from "@/lib/flightSearch";

export interface BusSearchResult {
  source: DataSource;
  buses: Bus[];
}

export async function searchBuses(params: { from: string; to: string; date: string }): Promise<BusSearchResult> {
  if (!isSerpApiConfigured()) {
    return { source: "mock", buses: generateMockBuses(params) };
  }
  try {
    return { source: "live", buses: await searchSerpApiBuses(params) };
  } catch (error) {
    console.error("SerpApi bus search failed, falling back to sample data:", error);
    return { source: "mock", buses: generateMockBuses(params) };
  }
}
