import { NextRequest } from "next/server";
import { searchFlights } from "@/lib/flightSearch";
import { parseSearchParams } from "@/lib/apiParams";

export async function GET(request: NextRequest) {
  const params = parseSearchParams(request.nextUrl.searchParams);
  if (!params) return Response.json({ error: "Invalid search parameters" }, { status: 400 });
  return Response.json(await searchFlights(params));
}
