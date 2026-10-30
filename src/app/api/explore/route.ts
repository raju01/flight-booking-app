import { NextRequest } from "next/server";
import { fetchExploreDestinations } from "@/lib/serpExplore";
import { isSerpApiConfigured } from "@/lib/serpapi";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const maxDuration = 30;

// Cheapest destinations from one airport. Without live data the page falls back to labelled samples.
export async function GET(request: NextRequest) {
  const wait = rateLimit(request, "explore", 20);
  if (wait > 0) return tooManyRequests(wait);
  const from = request.nextUrl.searchParams.get("from") ?? "";
  if (!/^[A-Z]{3}$/.test(from)) return Response.json({ error: "Invalid airport" }, { status: 400 });
  if (!isSerpApiConfigured()) return Response.json({ source: "mock", destinations: [] });
  try {
    return Response.json({ source: "live", destinations: await fetchExploreDestinations(from) });
  } catch (error) {
    console.error("Explore lookup failed:", error);
    return Response.json({ source: "mock", destinations: [] });
  }
}
