import { NextRequest } from "next/server";
import { isAirLabsConfigured, lookupAirLabsStatus } from "@/lib/airlabs";
import { lookupFlightStatus } from "@/lib/flightStatus";
import type { DataSource } from "@/lib/flightSearch";

// Live providers can take several seconds; without this a short platform default may cut them off.
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const flightNumber = (request.nextUrl.searchParams.get("flightNumber") ?? "")
    .toUpperCase()
    .replace(/\s+/g, "");
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!/^[A-Z0-9]{2}\d{1,4}$/.test(flightNumber) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Invalid flight number or date" }, { status: 400 });
  }

  if (isAirLabsConfigured()) {
    try {
      const status = await lookupAirLabsStatus(flightNumber, date);
      return Response.json({ source: "live" as DataSource, status });
    } catch (error) {
      console.error("AirLabs status lookup failed, falling back to sample data:", error);
    }
  }
  return Response.json({
    source: "mock" as DataSource,
    status: lookupFlightStatus(flightNumber, date),
  });
}
