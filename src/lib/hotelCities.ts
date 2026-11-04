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

// Places people stay that have no airport of their own (or are better known than their airport's town).
// The state goes into the Google Hotels query so "Aurangabad" or "Kasol" find the right place.
const STAY_DESTINATIONS: [name: string, state: string][] = [
  ["Manali", "Himachal Pradesh"], ["Shimla", "Himachal Pradesh"], ["Dharamshala", "Himachal Pradesh"],
  ["McLeod Ganj", "Himachal Pradesh"], ["Kasol", "Himachal Pradesh"], ["Dalhousie", "Himachal Pradesh"],
  ["Kasauli", "Himachal Pradesh"], ["Kufri", "Himachal Pradesh"], ["Spiti Valley", "Himachal Pradesh"],
  ["Mussoorie", "Uttarakhand"], ["Nainital", "Uttarakhand"], ["Rishikesh", "Uttarakhand"], ["Haridwar", "Uttarakhand"],
  ["Auli", "Uttarakhand"], ["Jim Corbett", "Uttarakhand"], ["Lansdowne", "Uttarakhand"], ["Almora", "Uttarakhand"],
  ["Ranikhet", "Uttarakhand"], ["Gulmarg", "Jammu and Kashmir"], ["Pahalgam", "Jammu and Kashmir"],
  ["Sonamarg", "Jammu and Kashmir"], ["Katra", "Jammu and Kashmir"], ["Nubra Valley", "Ladakh"],
  ["Darjeeling", "West Bengal"], ["Kalimpong", "West Bengal"], ["Digha", "West Bengal"], ["Siliguri", "West Bengal"],
  ["Gangtok", "Sikkim"], ["Pelling", "Sikkim"], ["Lachung", "Sikkim"], ["Shillong", "Meghalaya"],
  ["Cherrapunji", "Meghalaya"], ["Kaziranga", "Assam"], ["Tawang", "Arunachal Pradesh"],
  ["Ooty", "Tamil Nadu"], ["Kodaikanal", "Tamil Nadu"], ["Yercaud", "Tamil Nadu"], ["Rameswaram", "Tamil Nadu"],
  ["Kanyakumari", "Tamil Nadu"], ["Mahabalipuram", "Tamil Nadu"], ["Coonoor", "Tamil Nadu"], ["Pondicherry", "Puducherry"],
  ["Munnar", "Kerala"], ["Alleppey", "Kerala"], ["Kovalam", "Kerala"], ["Varkala", "Kerala"], ["Wayanad", "Kerala"],
  ["Thekkady", "Kerala"], ["Kumarakom", "Kerala"], ["Kochi", "Kerala"], ["Coorg", "Karnataka"], ["Chikmagalur", "Karnataka"],
  ["Mysuru", "Karnataka"], ["Hampi", "Karnataka"], ["Gokarna", "Karnataka"], ["Udupi", "Karnataka"],
  ["Lonavala", "Maharashtra"], ["Mahabaleshwar", "Maharashtra"], ["Alibaug", "Maharashtra"], ["Matheran", "Maharashtra"],
  ["Nashik", "Maharashtra"], ["Panchgani", "Maharashtra"], ["Calangute", "Goa"], ["Baga", "Goa"], ["Anjuna", "Goa"],
  ["Panaji", "Goa"], ["Palolem", "Goa"], ["Mount Abu", "Rajasthan"], ["Pushkar", "Rajasthan"], ["Ranthambore", "Rajasthan"],
  ["Bikaner", "Rajasthan"], ["Chittorgarh", "Rajasthan"], ["Ajmer", "Rajasthan"], ["Mathura", "Uttar Pradesh"],
  ["Vrindavan", "Uttar Pradesh"], ["Ayodhya", "Uttar Pradesh"], ["Khajuraho", "Madhya Pradesh"], ["Pachmarhi", "Madhya Pradesh"],
  ["Ujjain", "Madhya Pradesh"], ["Orchha", "Madhya Pradesh"], ["Puri", "Odisha"], ["Konark", "Odisha"],
  ["Bodh Gaya", "Bihar"], ["Rajgir", "Bihar"], ["Sasan Gir", "Gujarat"], ["Dwarka", "Gujarat"], ["Somnath", "Gujarat"],
  ["Kevadia", "Gujarat"], ["Daman", "Dadra and Nagar Haveli and Daman and Diu"], ["Tirupati", "Andhra Pradesh"],
  ["Araku Valley", "Andhra Pradesh"], ["Havelock Island", "Andaman and Nicobar Islands"],
  ["Neil Island", "Andaman and Nicobar Islands"],
];

// Shown as soon as the destination box is opened.
const POPULAR_STAYS = [
  "Goa", "Jaipur", "Udaipur", "Manali", "Shimla", "Munnar", "Ooty", "Rishikesh", "Leh", "Srinagar", "Darjeeling", "Coorg",
  "Mumbai", "New Delhi", "Bengaluru", "Varanasi", "Agra", "Pondicherry", "Port Blair", "Gangtok",
];

export interface HotelDestination {
  name: string; // what people see and search for, e.g. "Manali"
  region: string; // state for Indian places (may be empty), country abroad
  india: boolean;
}

function buildDestinations(): HotelDestination[] {
  const byName = new Map<string, HotelDestination>();
  for (const airport of AIRPORTS) {
    const india = isIndianAirport(airport);
    const name = india ? hotelTown(airport.code) : airport.city.replace(/\s*\(.*\)$/, "");
    if (name && !byName.has(name.toLowerCase())) byName.set(name.toLowerCase(), { name, region: airport.country ?? "", india });
  }
  for (const [name, state] of STAY_DESTINATIONS) byName.set(name.toLowerCase(), { name, region: state, india: true });
  // India first, then alphabetical.
  return [...byName.values()].sort((a, b) => Number(b.india) - Number(a.india) || a.name.localeCompare(b.name));
}

export const HOTEL_DESTINATIONS: HotelDestination[] = buildDestinations();

export const POPULAR_HOTEL_DESTINATIONS: HotelDestination[] = POPULAR_STAYS.map((name) =>
  HOTEL_DESTINATIONS.find((d) => d.name === name)
).filter((d): d is HotelDestination => d !== undefined);

export function findDestination(name: string): HotelDestination | undefined {
  const key = name.trim().toLowerCase();
  return HOTEL_DESTINATIONS.find((d) => d.name.toLowerCase() === key);
}

// Letters (any script), spaces and simple punctuation only; this text becomes a Google Hotels query.
const PLACE_TEXT = /^[\p{L}\p{M}][\p{L}\p{M} .,'()&-]{1,59}$/u;

// The place to search stays in: a known destination gets its state and country added, anything else
// that looks like a place name is searched as typed (people mostly type Indian towns).
export function resolveStayPlace(text: string): { name: string; query: string; india: boolean } | null {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!PLACE_TEXT.test(cleaned)) return null;
  const known = findDestination(cleaned);
  if (!known) return { name: cleaned, query: cleaned, india: true };
  const query = known.india ? [known.name, known.region, "India"].filter(Boolean).join(", ") : `${known.name}, ${known.region}`;
  return { name: known.name, query, india: known.india };
}

export const MAX_HOTEL_ADULTS = 8;
export const MAX_HOTEL_CHILDREN = 4;

// The destination named in a hotel search link: `place=Manali`, or the older `city=GOI` airport form.
export function placeParam(get: (key: string) => string | null | undefined): string {
  const place = get("place")?.trim();
  if (place) return place;
  return stayPlace(String(get("city") ?? ""))?.name ?? "";
}

// "5,9" -> [5, 9]: each child's age (1-17), which Google needs to price the room. null if malformed.
export function parseChildAges(raw: string | null | undefined): number[] | null {
  if (!raw) return [];
  const ages = raw.split(",").map((a) => Number(a.trim()));
  if (ages.length > MAX_HOTEL_CHILDREN || ages.some((a) => !Number.isInteger(a) || a < 1 || a > 17)) return null;
  return ages;
}
