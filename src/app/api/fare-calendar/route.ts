import { NextRequest } from "next/server";
import { searchFlights, DataSource } from "@/lib/flightSearch";
import { parseSearchParams } from "@/lib/apiParams";
import { isSerpApiConfigured } from "@/lib/serpapi";

const SPAN_DAYS = 3;

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const params = parseSearchParams(request.nextUrl.searchParams);
  if (!params) return Response.json({ error: "Invalid search parameters" }, { status: 400 });

  // Each day is a separate paid SerpApi search, so live calendars are opt-in.
  if (isSerpApiConfigured() && process.env.SERPAPI_FARE_CALENDAR !== "1") {
    return Response.json({ source: "live", days: [] });
  }

  const today = new Date().toISOString().slice(0, 10);
  const dates = Array.from({ length: SPAN_DAYS * 2 + 1 }, (_, i) => addDays(params.date, i - SPAN_DAYS));

  const days = await Promise.all(
    dates.map(async (date) => {
      if (date < today) return { date, price: null, source: "live" as DataSource };
      const result = await searchFlights({ ...params, date });
      const price = result.flights.length ? Math.min(...result.flights.map((f) => f.price)) : null;
      return { date, price, source: result.source };
    })
  );

  const source: DataSource = days.every((d) => d.source === "live") ? "live" : "mock";
  return Response.json({ source, days: days.map(({ date, price }) => ({ date, price })) });
}
