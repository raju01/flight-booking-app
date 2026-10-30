import { Flight, CabinClass } from "@/types/flight";
import { findAirport, isIndianAirport } from "@/lib/airports";
import { seededRandom, seedFromString, pad } from "@/lib/seededRandom";
import { SOLO, payingTravelers } from "@/lib/party";
import { TravelerCounts } from "@/types/traveler";

const AIRLINES = [
  { name: "IndiGo", code: "6E" },
  { name: "Air India", code: "AI" },
  { name: "SpiceJet", code: "SG" },
  { name: "Vistara", code: "UK" },
  { name: "Akasa Air", code: "QP" },
  { name: "Air India Express", code: "IX" },
];

const INTERNATIONAL_AIRLINES = [
  { name: "Air India", code: "AI" },
  { name: "IndiGo", code: "6E" },
  { name: "Emirates", code: "EK" },
  { name: "Qatar Airways", code: "QR" },
  { name: "Singapore Airlines", code: "SQ" },
  { name: "Etihad", code: "EY" },
];

const CABIN_MULTIPLIER: Record<CabinClass, number> = {
  Economy: 1,
  "Premium Economy": 1.6,
  Business: 3.2,
  First: 5,
};

export function generateMockFlights(params: {
  from: string;
  to: string;
  date: string;
  cabinClass: CabinClass;
  travelers?: TravelerCounts;
}): Flight[] {
  const travelers = params.travelers ?? SOLO;
  const fromAirport = findAirport(params.from);
  const toAirport = findAirport(params.to);
  if (!fromAirport || !toAirport) return [];

  const international = !isIndianAirport(fromAirport) || !isIndianAirport(toAirport);
  const airlines = international ? INTERNATIONAL_AIRLINES : AIRLINES;
  const rand = seededRandom(seedFromString(`${params.from}${params.to}${params.date}`));

  const count = 6 + Math.floor(rand() * 4);
  const flights: Flight[] = [];

  for (let i = 0; i < count; i++) {
    const airline = airlines[Math.floor(rand() * airlines.length)];
    const stops = rand() > 0.6 ? 1 : 0;
    const durationMinutes = international
      ? 240 + Math.floor(rand() * 600) + stops * 150
      : 90 + Math.floor(rand() * 600) + stops * 120;
    const departHour = Math.floor(rand() * 24);
    const departMinute = Math.floor(rand() * 60);

    const departureTime = new Date(`${params.date}T${pad(departHour)}:${pad(departMinute)}:00`);
    const arrivalTime = new Date(departureTime.getTime() + durationMinutes * 60000);

    const basePrice = international
      ? 14000 + Math.floor(rand() * 36000) + stops * -2500
      : 2500 + Math.floor(rand() * 7000) + stops * -600;
    const price = Math.round((basePrice * CABIN_MULTIPLIER[params.cabinClass] * payingTravelers(travelers)) / 10) * 10;

    flights.push({
      id: `${airline.code}-${params.from}-${params.to}-${i}`,
      stops,
      price,
      currency: "INR",
      cabinClass: params.cabinClass,
      travelers,
      seatsLeft: 1 + Math.floor(rand() * 9),
      segments: [
        {
          airline: airline.name,
          flightNumber: `${airline.code}${100 + Math.floor(rand() * 900)}`,
          from: fromAirport,
          to: toAirport,
          departureTime: departureTime.toISOString(),
          arrivalTime: arrivalTime.toISOString(),
          durationMinutes,
        },
      ],
    });
  }

  return flights.sort((a, b) => a.price - b.price);
}
