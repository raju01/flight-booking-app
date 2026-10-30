import { CabinClass, Flight, PriceInsights } from "@/types/flight";
import { TravelerCounts } from "@/types/traveler";
import { generateMockFlights } from "@/lib/mockFlights";
import { isSerpApiConfigured, searchSerpApiFlights } from "@/lib/serpapi";
import { sampleDataAllowed } from "@/lib/sampleData";

// "mock" is generated sample data (development only); "unavailable" means live data could not be fetched.
export type DataSource = "live" | "mock" | "unavailable";

export interface FlightSearchResult {
  source: DataSource;
  flights: Flight[];
  insights?: PriceInsights;
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
  travelers?: TravelerCounts;
}): Promise<FlightSearchResult> {
  const unavailable = (notice: string): FlightSearchResult => ({ source: "unavailable", flights: [], notice });
  if (!isSerpApiConfigured()) {
    return sampleDataAllowed()
      ? { source: "mock", flights: generateMockFlights(params), notice: "No SERPAPI_API_KEY configured" }
      : unavailable("Live fares are not configured");
  }
  try {
    const { flights, insights } = await searchSerpApiFlights(params);
    return { source: "live", flights, insights };
  } catch (error) {
    console.error("SerpApi flight search failed:", error);
    return sampleDataAllowed()
      ? { source: "mock", flights: generateMockFlights(params), notice: "Live search is unavailable right now" }
      : unavailable("Live fares are temporarily unavailable");
  }
}
