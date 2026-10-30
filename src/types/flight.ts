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
  seatsLeft?: number; // absent when the provider doesn't report availability
  fareTier?: FareTier;
  priceLocked?: boolean;
  bookingUrl?: string; // set for live fares, which are booked on the airline's site rather than here
  bookingToken?: string; // live fares only: lets us ask which sellers offer this exact flight
}

// One seller's price for a flight. Booking is a form POST to `url` with `postData` as its fields.
export interface FlightOffer {
  seller: string;
  price: number;
  url: string;
  postData: string;
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
