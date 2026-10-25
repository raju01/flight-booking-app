import { CabinClass } from "@/types/flight";

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
    CABIN_CLASSES.includes(cabinClass);
  return valid ? { from, to, date, cabinClass, passengers: Math.floor(passengers) } : null;
}
