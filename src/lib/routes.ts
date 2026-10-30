import { findAirport, isIndianAirport } from "@/lib/airports";
import { Airport } from "@/types/flight";

// Routes that get their own landing page. Kept to well-served city pairs so every page is useful.
const DOMESTIC_HUBS = ["DEL", "BOM", "BLR", "HYD", "MAA", "CCU", "PNQ", "AMD", "GOI", "COK", "JAI", "LKO"];
const INTERNATIONAL_HUBS = ["DEL", "BOM", "BLR", "MAA", "HYD", "CCU"];
const INTERNATIONAL_DESTINATIONS = [
  "DXB", "AUH", "DOH", "SIN", "BKK", "KUL", "HKG", "LHR", "CDG", "FRA",
  "AMS", "JFK", "SFO", "SYD", "NRT", "ICN", "CMB", "KTM", "DPS", "MLE",
];

export interface RoutePair {
  from: string;
  to: string;
}

function buildRoutes(): RoutePair[] {
  const routes: RoutePair[] = [];
  for (const from of DOMESTIC_HUBS) {
    for (const to of DOMESTIC_HUBS) if (from !== to) routes.push({ from, to });
  }
  for (const hub of INTERNATIONAL_HUBS) {
    for (const destination of INTERNATIONAL_DESTINATIONS) {
      routes.push({ from: hub, to: destination }, { from: destination, to: hub });
    }
  }
  return routes;
}

export const ROUTES: RoutePair[] = buildRoutes();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function routeSlug({ from, to }: RoutePair): string {
  const a = findAirport(from);
  const b = findAirport(to);
  return `${slugify(a?.city ?? from)}-to-${slugify(b?.city ?? to)}`;
}

const SLUG_INDEX = new Map(ROUTES.map((route) => [routeSlug(route), route]));

export function routeFromSlug(slug: string): RoutePair | undefined {
  return SLUG_INDEX.get(slug);
}

export function isInternationalRoute({ from, to }: RoutePair): boolean {
  return !isIndianAirport(findAirport(from)) || !isIndianAirport(findAirport(to));
}

// Place name without the airport qualifier, e.g. "Goa (Dabolim)" -> "Goa".
export function placeName(airport: Airport): string {
  return airport.city.replace(/\s*\(.*\)$/, "");
}

// Other routes from the same origin or into the same destination, for internal links.
export function relatedRoutes(route: RoutePair, limit = 8): RoutePair[] {
  const reverse = ROUTES.find((r) => r.from === route.to && r.to === route.from);
  const sameOrigin = ROUTES.filter((r) => r.from === route.from && r.to !== route.to);
  const sameDestination = ROUTES.filter((r) => r.to === route.to && r.from !== route.from);
  const picked: RoutePair[] = reverse ? [reverse] : [];
  for (let i = 0; picked.length < limit && (i < sameOrigin.length || i < sameDestination.length); i++) {
    if (sameOrigin[i]) picked.push(sameOrigin[i]);
    if (sameDestination[i] && picked.length < limit) picked.push(sameDestination[i]);
  }
  return picked.slice(0, limit);
}
