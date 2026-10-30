import { NextRequest } from "next/server";
import { fetchFlightOffers, isSerpApiConfigured } from "@/lib/serpapi";
import { CabinClass } from "@/types/flight";

export const maxDuration = 30;

const CABINS: CabinClass[] = ["Economy", "Premium Economy", "Business", "First"];

// Sellers and prices for one live flight. POST because the booking token is too long for a URL.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    from?: string;
    to?: string;
    date?: string;
    cabinClass?: CabinClass;
    token?: string;
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

  try {
    return Response.json({ offers: await fetchFlightOffers({ from, to, date, cabinClass, token }) });
  } catch (error) {
    console.error("Flight offers lookup failed:", error);
    return Response.json({ offers: [], error: "Seller prices are unavailable right now" }, { status: 502 });
  }
}
