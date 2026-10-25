import { NextRequest } from "next/server";
import { searchFlights } from "@/lib/flightSearch";
import { parseSearchParams } from "@/lib/apiParams";

// Live providers can take several seconds; without this a short platform default may cut them off.
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const params = parseSearchParams(request.nextUrl.searchParams);
  if (!params) return Response.json({ error: "Invalid search parameters" }, { status: 400 });
  return Response.json(await searchFlights(params));
}
