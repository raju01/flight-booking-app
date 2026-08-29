import { FareTier } from "@/types/fareTier";

export type CabinClass = "Economy" | "Premium Economy" | "Business" | "First";

export interface Airport {
  code: string;
  city: string;
  name: string;
  aliases?: string[];
}

export interface FlightSegment {
  airline: string;
  flightNumber: string;
  from: Airport;
  to: Airport;
  departureTime: string; // ISO string
  arrivalTime: string; // ISO string
  durationMinutes: number;
}

export interface Flight {
  id: string;
  segments: FlightSegment[];
  stops: number;
  price: number;
  currency: string;
  cabinClass: CabinClass;
  seatsLeft: number;
  fareTier?: FareTier;
  priceLocked?: boolean;
}

export interface SearchParams {
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
  tripType: "one-way" | "round-trip";
}

export interface Passenger {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  travelerType: "adult" | "child" | "infant";
}
