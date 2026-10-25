import { FlightStatusInfo, FlightStatusState } from "@/types/flightStatus";
import { airlineFromFlightNumber } from "@/lib/flightStatus";

const REQUEST_TIMEOUT_MS = 10000;

interface AirLabsFlight {
  airline_iata: string | null;
  flight_iata: string;
  status: "scheduled" | "en-route" | "landed";
  dep_terminal: string | null;
  dep_gate: string | null;
  dep_time: string; // airport-local "YYYY-MM-DD HH:mm"
  dep_estimated: string | null;
  dep_delayed: number | null;
  arr_baggage: string | null;
  arr_time: string;
  arr_estimated: string | null;
  arr_delayed: number | null;
}

export function isAirLabsConfigured(): boolean {
  return Boolean(process.env.AIRLABS_API_KEY);
}

// AirLabs times are airport-local wall-clock; keep them as-is so the browser shows the same clock time.
function toLocalIso(time: string): string {
  return `${time.replace(" ", "T")}:00`;
}

const STATE_BY_AIRLABS_STATUS = { scheduled: "scheduled", "en-route": "departed", landed: "landed" } as const;

// Returns null when AirLabs has no flight for that number on that date.
export async function lookupAirLabsStatus(
  flightNumber: string,
  date: string
): Promise<FlightStatusInfo | null> {
  const params = new URLSearchParams({
    flight_iata: flightNumber,
    api_key: process.env.AIRLABS_API_KEY ?? "",
  });
  const res = await fetch(`https://airlabs.co/api/v9/flight?${params}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`AirLabs ${res.status}`);

  const body = (await res.json()) as { response?: AirLabsFlight; error?: { message: string } };
  if (body.error) throw new Error(`AirLabs: ${body.error.message}`);
  const flight = body.response;
  // /flight has no date parameter and returns the closest run, so reject runs on other days.
  if (!flight || flight.dep_time.slice(0, 10) !== date) return null;

  const delayMinutes = Math.max(flight.dep_delayed ?? 0, 0);
  let status: FlightStatusState = STATE_BY_AIRLABS_STATUS[flight.status] ?? "scheduled";
  if (status === "scheduled" && delayMinutes > 0) status = "delayed";

  return {
    flightNumber: flight.flight_iata,
    airline: airlineFromFlightNumber(flight.flight_iata) ?? flight.airline_iata ?? "Unknown airline",
    status,
    delayMinutes,
    gate: flight.dep_gate ?? "—",
    terminal: flight.dep_terminal ?? "—",
    scheduledDeparture: toLocalIso(flight.dep_time),
    estimatedDeparture: toLocalIso(flight.dep_estimated ?? flight.dep_time),
    scheduledArrival: toLocalIso(flight.arr_time),
    estimatedArrival: toLocalIso(flight.arr_estimated ?? flight.arr_time),
    baggageBelt: status === "landed" ? (flight.arr_baggage ?? undefined) : undefined,
  };
}
