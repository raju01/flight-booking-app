import { CabinClass, Flight } from "@/types/flight";
import { generateMockFlights } from "@/lib/mockFlights";
import { isSerpApiConfigured, searchSerpApiFlights } from "@/lib/serpapi";

export type DataSource = "live" | "mock";

export interface FlightSearchResult {
  source: DataSource;
  flights: Flight[];
  notice?: string;
}

// Live Google Flights fares when a SerpApi key is configured; otherwise (or if SerpApi fails) the sample generator,
// so the app keeps working without credentials.
export async function searchFlights(params: {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
  passengers: number;
}): Promise<FlightSearchResult> {
  if (!isSerpApiConfigured()) {
    return {
      source: "mock",
      flights: generateMockFlights(params),
      notice: "No SERPAPI_API_KEY configured",
    };
  }
  try {
    return { source: "live", flights: await searchSerpApiFlights(params) };
  } catch (error) {
    console.error("SerpApi flight search failed, falling back to sample data:", error);
    return {
      source: "mock",
      flights: generateMockFlights(params),
      notice: "Live search is unavailable right now",
    };
  }
}
