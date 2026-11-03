import { findAirport, isIndianAirport } from "@/lib/airports";

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

// "Goa" for GOI, never the airport's "(Dabolim)" part. Indian airports only.
export function hotelTown(airportCode: string): string | null {
  const airport = findAirport(airportCode);
  if (!airport || !isIndianAirport(airport)) return null;
  return STAY_TOWN[airportCode] ?? airport.city.replace(/\s*\(.*\)$/, "").replace(/\s+Airport$/, "");
}
