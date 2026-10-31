import { NextRequest } from "next/server";
import { fetchFlightOffers, isSerpApiConfigured } from "@/lib/serpapi";
import { CabinClass } from "@/types/flight";
import { parseTravelers } from "@/lib/party";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { reconcileOffers } from "@/lib/offersMemory";

export const maxDuration = 30;

const CABINS: CabinClass[] = ["Economy", "Premium Economy", "Business", "First"];

// Sellers and prices for one live flight. POST because the booking token is too long for a URL.
export async function POST(request: NextRequest) {
  const wait = rateLimit(request, "offers", 60);
  if (wait > 0) return tooManyRequests(wait);
  const body = (await request.json().catch(() => null)) as {
    from?: string;
    to?: string;
    date?: string;
    cabinClass?: CabinClass;
    token?: string;
    flightKey?: string;
    adults?: number;
    children?: number;
    infants?: number;
  } | null;
  const { from = "", to = "", date = "", cabinClass, token = "" } = body ?? {};
  const valid =
    /^[A-Z]{3}$/.test(from) &&
    /^[A-Z]{3}$/.test(to) &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    cabinClass !== undefined &&
    CABINS.includes(cabinClass) &&
    token.length > 0 &&
    token.length <= 8000;
  if (!valid) return Response.json({ error: "Invalid parameters" }, { status: 400 });
  if (!isSerpApiConfigured()) return Response.json({ offers: [] });

  const travelers = parseTravelers((key) => (body as Record<string, unknown>)[key]);
  // Identifies the flight itself (not the search), so a richer seller list seen earlier can be recalled.
  const flightKey = typeof body?.flightKey === "string" && /^[A-Za-z0-9+|:._-]{1,200}$/.test(body.flightKey) ? body.flightKey : null;
  const memoryKey = flightKey
    ? `offers:${from}|${to}|${date}|${cabinClass}|${travelers.adults}-${travelers.children}-${travelers.infants}|${flightKey}`
    : null;

  try {
    const fresh = await fetchFlightOffers({ from, to, date, cabinClass, token, travelers });
    const result = memoryKey ? await reconcileOffers(memoryKey, fresh) : null;
    return Response.json(result ?? { offers: fresh });
  } catch (error) {
    console.error("Flight offers lookup failed:", error);
    // A failed lookup is better answered with the sellers we saw recently than with nothing.
    const remembered = memoryKey ? await reconcileOffers(memoryKey, null).catch(() => null) : null;
    if (remembered) return Response.json(remembered);
    return Response.json({ offers: [], error: "Seller prices are unavailable right now" }, { status: 502 });
  }
}
