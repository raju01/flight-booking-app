import { NextRequest } from "next/server";
import { searchFlights } from "@/lib/flightSearch";
import { parseSearchParams } from "@/lib/apiParams";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

// Live providers can take several seconds; without this a short platform default may cut them off.
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const wait = rateLimit(request, "flights", 40);
  if (wait > 0) return tooManyRequests(wait);
  const params = parseSearchParams(request.nextUrl.searchParams);
  if (!params) return Response.json({ error: "Invalid search parameters" }, { status: 400 });
  // "Refresh prices" skips the stored result and spends credits, so it has a tighter limit of its own.
  const fresh = request.nextUrl.searchParams.get("fresh") === "1";
  if (fresh) {
    const refreshWait = rateLimit(request, "flights-refresh", 6);
    if (refreshWait > 0) return tooManyRequests(refreshWait);
  }
  return Response.json(await searchFlights(params, fresh));
}
