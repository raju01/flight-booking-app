import { AIRPORTS, isIndianAirport } from "@/lib/airports";

// Cleartrip Hotels pays per booking through Cuelinks, but only links to its hotels home page are tracked
// as hotels (checked 2026-11-04: any deeper hotel URL is sent to the flights campaign and lands on
// Cleartrip Flights). So the link opens that page and we tell people which town to search for.

// Airports named after a village or district, mapped to the town travellers usually stay in.
const STAY_TOWN: Record<string, string> = {
  AIP: "Jalandhar",
  DXN: "Noida",
  HGI: "Itanagar",
  HWR: "Ludhiana",
  IXI: "North Lakhimpur",
  JRG: "Jharsuguda",
  JSA: "Jaisalmer",
  KJB: "Kurnool",
  SAG: "Shirdi",
  SDW: "Malvan",
  TCR: "Thoothukudi",
  TEZ: "Tezpur",
};

export const CLEARTRIP_HOTELS_URL = "https://www.cleartrip.com/hotels";

// Only airports in the bundled list: findAirport() invents an entry for any three-letter code.
const known = (code: string) => AIRPORTS.find((a) => a.code === code);

// "Goa" for GOI, never the airport's "(Dabolim)" part. Indian airports only.
export function hotelTown(airportCode: string): string | null {
  const airport = known(airportCode);
  if (!airport || !isIndianAirport(airport)) return null;
  return STAY_TOWN[airportCode] ?? airport.city.replace(/\s*\(.*\)$/, "").replace(/\s+Airport$/, "");
}

// The place to search stays in for an airport, e.g. "Goa, India" or "Dubai, United Arab Emirates".
export function stayPlace(airportCode: string): { name: string; query: string } | null {
  const airport = known(airportCode);
  if (!airport) return null;
  const indian = hotelTown(airportCode);
  if (indian) return { name: indian, query: `${indian}, India` };
  const name = airport.city.replace(/\s*\(.*\)$/, "");
  return { name, query: airport.country ? `${name}, ${airport.country}` : name };
}
