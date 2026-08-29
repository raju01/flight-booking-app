import { FlightStatusInfo, FlightStatusState } from "@/types/flightStatus";
import { seededRandom, seedFromString, pad } from "@/lib/seededRandom";

const AIRLINE_CODES: Record<string, string> = {
  "6E": "IndiGo",
  AI: "Air India",
  SG: "SpiceJet",
  UK: "Vistara",
  QP: "Akasa Air",
  IX: "Air India Express",
};

export function airlineFromFlightNumber(flightNumber: string): string | null {
  const code = flightNumber.trim().slice(0, 2).toUpperCase();
  return AIRLINE_CODES[code] ?? null;
}

export function lookupFlightStatus(flightNumber: string, date: string): FlightStatusInfo | null {
  const normalized = flightNumber.trim().toUpperCase().replace(/\s+/g, "");
  const airline = airlineFromFlightNumber(normalized);
  if (!airline || normalized.length < 3) return null;

  const rand = seededRandom(seedFromString(`status-${normalized}-${date}`));

  const departHour = 5 + Math.floor(rand() * 18);
  const departMinute = Math.floor(rand() * 60);
  const durationMinutes = 75 + Math.floor(rand() * 240);

  const scheduledDeparture = new Date(`${date}T${pad(departHour)}:${pad(departMinute)}:00`);
  const scheduledArrival = new Date(scheduledDeparture.getTime() + durationMinutes * 60000);

  const roll = rand();
  let status: FlightStatusState = "scheduled";
  let delayMinutes = 0;
  if (roll < 0.08) {
    status = "cancelled";
  } else if (roll < 0.28) {
    status = "delayed";
    delayMinutes = 15 + Math.floor(rand() * 105);
  } else {
    status = "scheduled";
  }

  const now = new Date();
  const minutesToDeparture = (scheduledDeparture.getTime() - now.getTime()) / 60000;
  if (status !== "cancelled") {
    if (minutesToDeparture < -durationMinutes) status = "landed";
    else if (minutesToDeparture < 0) status = "departed";
  }

  const estimatedDeparture = new Date(scheduledDeparture.getTime() + delayMinutes * 60000);
  const estimatedArrival = new Date(scheduledArrival.getTime() + delayMinutes * 60000);

  return {
    flightNumber: normalized,
    airline,
    status,
    delayMinutes,
    gate: `${String.fromCharCode(65 + (normalized.length % 6))}${1 + (normalized.charCodeAt(normalized.length - 1) % 30)}`,
    terminal: `T${1 + (normalized.charCodeAt(0) % 3)}`,
    scheduledDeparture: scheduledDeparture.toISOString(),
    estimatedDeparture: estimatedDeparture.toISOString(),
    scheduledArrival: scheduledArrival.toISOString(),
    estimatedArrival: estimatedArrival.toISOString(),
    baggageBelt: status === "landed" ? `${1 + (normalized.length % 8)}` : undefined,
  };
}
