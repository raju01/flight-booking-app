import { Bus, SeatType } from "@/types/bus";
import { findAirport } from "@/lib/airports";
import { seededRandom, seedFromString, pad } from "@/lib/seededRandom";

const OPERATORS = [
  "VRL Travels",
  "SRS Travels",
  "Orange Tours & Travels",
  "KSRTC",
  "Neeta Tours",
  "Parveen Travels",
  "Zingbus",
  "IntrCity SmartBus",
];

const SEAT_TYPES: SeatType[] = ["Seater", "Sleeper", "AC Semi-Sleeper", "AC Sleeper"];

const SEAT_TYPE_MULTIPLIER: Record<SeatType, number> = {
  Seater: 1,
  Sleeper: 1.4,
  "AC Semi-Sleeper": 1.7,
  "AC Sleeper": 2.2,
};

const ALL_AMENITIES = ["WiFi", "Charging point", "Blanket", "Water bottle", "Live tracking", "CCTV"];

function pickAmenities(rand: () => number): string[] {
  return ALL_AMENITIES.filter(() => rand() > 0.45);
}

export function generateMockBuses(params: {
  from: string;
  to: string;
  date: string;
}): Bus[] {
  const fromAirport = findAirport(params.from);
  const toAirport = findAirport(params.to);
  if (!fromAirport || !toAirport) return [];

  const fromCity = fromAirport.city.replace(/\s*\([^)]*\)/g, "");
  const toCity = toAirport.city.replace(/\s*\([^)]*\)/g, "");

  const rand = seededRandom(seedFromString(`bus-${params.from}${params.to}${params.date}`));

  const count = 5 + Math.floor(rand() * 5);
  const buses: Bus[] = [];

  for (let i = 0; i < count; i++) {
    const operator = OPERATORS[Math.floor(rand() * OPERATORS.length)];
    const seatType = SEAT_TYPES[Math.floor(rand() * SEAT_TYPES.length)];
    const durationMinutes = 240 + Math.floor(rand() * 600);
    const departHour = Math.floor(rand() * 24);
    const departMinute = Math.floor(rand() * 60);

    const departureTime = new Date(`${params.date}T${pad(departHour)}:${pad(departMinute)}:00`);
    const arrivalTime = new Date(departureTime.getTime() + durationMinutes * 60000);

    const basePrice = 350 + Math.floor(rand() * 1200);
    const price = Math.round((basePrice * SEAT_TYPE_MULTIPLIER[seatType]) / 10) * 10;

    buses.push({
      id: `BUS-${params.from}-${params.to}-${i}`,
      operator,
      busNumber: `${operator.slice(0, 2).toUpperCase()}${1000 + Math.floor(rand() * 9000)}`,
      from: fromCity,
      to: toCity,
      departureTime: departureTime.toISOString(),
      arrivalTime: arrivalTime.toISOString(),
      durationMinutes,
      seatType,
      price,
      currency: "INR",
      seatsLeft: 1 + Math.floor(rand() * 30),
      rating: Math.round((3 + rand() * 2) * 10) / 10,
      amenities: pickAmenities(rand),
    });
  }

  return buses.sort((a, b) => a.price - b.price);
}
