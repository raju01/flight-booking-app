import { NextRequest } from "next/server";
import { hotelOffers, parseStay } from "@/lib/hotelSearch";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export const maxDuration = 30;

// POST so the long property token stays out of URLs and logs.
export async function POST(request: NextRequest) {
  const wait = rateLimit(request, "hotel-offers", 30);
  if (wait > 0) return tooManyRequests(wait);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid parameters" }, { status: 400 });
  const stay = parseStay((key) => (body[key] === undefined ? null : String(body[key])));
  const token = typeof body.token === "string" ? body.token : "";
  if (!stay || !/^[A-Za-z0-9_-]{10,200}$/.test(token)) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const offers = await hotelOffers(stay, token);
  if (!offers) return Response.json({ error: "Prices are unavailable right now" }, { status: 502 });
  return Response.json({ offers });
}
