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
  seatType: SeatType;
  price: number;
  currency: string;
  seatsLeft: number;
  rating: number; // 1-5
  amenities: string[];
}
