import { NextRequest } from "next/server";
import { parseSearchParams } from "@/lib/apiParams";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { fetchGroupInsights, isSerpApiConfigured } from "@/lib/serpapi";

export const maxDuration = 30;

// Price history for a group, estimated from the single-traveller history. One extra SerpApi lookup, so the
// page only asks for it when the visitor opens the chart.
export async function GET(request: NextRequest) {
  const wait = rateLimit(request, "history", 20);
  if (wait > 0) return tooManyRequests(wait);
  const params = parseSearchParams(request.nextUrl.searchParams);
  if (!params) return Response.json({ error: "Invalid search parameters" }, { status: 400 });
  if (!isSerpApiConfigured()) return Response.json({ insights: null });
  try {
    const insights = await fetchGroupInsights({
      from: params.from,
      to: params.to,
      date: params.date,
      cabinClass: params.cabinClass,
      travelers: params.travelers,
    });
    return Response.json({ insights: insights ?? null });
  } catch (error) {
    console.error("Group price history lookup failed:", error);
    return Response.json({ insights: null }, { status: 502 });
  }
}
