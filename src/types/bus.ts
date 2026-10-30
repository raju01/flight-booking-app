export type SeatType = "Seater" | "Sleeper" | "AC Semi-Sleeper" | "AC Sleeper";

export interface Bus {
  id: string;
  operator: string;
  busNumber: string;
  from: string; // city
  to: string; // city
  departureTime: string; // ISO string
  arrivalTime: string; // ISO string
  durationMinutes: number;
  seatType: SeatType | null;
  price: number | null;
  currency: string;
  seatsLeft: number | null;
  rating: number | null; // 1-5, null when the provider does not publish one
  amenities: string[];
}
