import { CabinClass } from "@/types/flight";
import { todayInIndia } from "@/lib/dates";
import { parseTravelers } from "@/lib/party";

const CABIN_CLASSES: CabinClass[] = ["Economy", "Premium Economy", "Business", "First"];
const MAX_PASSENGERS = 9;

export function parseSearchParams(searchParams: URLSearchParams) {
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const date = searchParams.get("date") ?? "";
  const cabinClass = (searchParams.get("cabinClass") ?? "Economy") as CabinClass;
  const passengers = Math.min(Math.max(Number(searchParams.get("passengers") ?? "1") || 1, 1), MAX_PASSENGERS);

  const valid =
    /^[A-Z]{3}$/.test(from) &&
    /^[A-Z]{3}$/.test(to) &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    date >= todayInIndia() && // flights can be booked for today and later only
    CABIN_CLASSES.includes(cabinClass);
  if (!valid) return null;
  const travelers = parseTravelers((key) => searchParams.get(key), Math.floor(passengers));
  return { from, to, date, cabinClass, passengers: travelers.adults + travelers.children, travelers };
}
