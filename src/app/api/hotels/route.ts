import { NextRequest } from "next/server";
import { parseStay, searchHotels } from "@/lib/hotelSearch";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const wait = rateLimit(request, "hotels", 20);
  if (wait > 0) return tooManyRequests(wait);
  const stay = parseStay((key) => request.nextUrl.searchParams.get(key));
  if (!stay) return Response.json({ error: "Invalid search parameters" }, { status: 400 });
  return Response.json(await searchHotels(stay));
}
