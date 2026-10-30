import { NextRequest } from "next/server";
import { searchBuses } from "@/lib/busSearch";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const valid = /^[A-Z]{3}$/.test(from) && /^[A-Z]{3}$/.test(to) && /^\d{4}-\d{2}-\d{2}$/.test(date);
  if (!valid) return Response.json({ error: "Invalid search parameters" }, { status: 400 });
  return Response.json(await searchBuses({ from, to, date }));
}
