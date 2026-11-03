import { NextRequest } from "next/server";
import { parseStay, searchHotels } from "@/lib/hotelSearch";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const wait = rateLimit(request, "hotels", 20);
  if (wait > 0) return tooManyRequests(wait);
  const stay = parseStay((key) => request.nextUrl.searchParams.get(key));
  if (!stay) return Response.json({ error: "Invalid search parameters" }, { status: 400 });
  // "Refresh prices" skips the stored result and spends a credit, so it has a tighter limit.
  const fresh = request.nextUrl.searchParams.get("fresh") === "1";
  if (fresh) {
    const refreshWait = rateLimit(request, "hotels-refresh", 6);
    if (refreshWait > 0) return tooManyRequests(refreshWait);
  }
  return Response.json(await searchHotels(stay, fresh));
}
