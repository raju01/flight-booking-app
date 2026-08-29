export type FlightStatusState = "scheduled" | "delayed" | "departed" | "landed" | "cancelled";

export interface FlightStatusInfo {
  flightNumber: string;
  airline: string;
  status: FlightStatusState;
  delayMinutes: number;
  gate: string;
  terminal: string;
  scheduledDeparture: string;
  estimatedDeparture: string;
  scheduledArrival: string;
  estimatedArrival: string;
  baggageBelt?: string;
}
