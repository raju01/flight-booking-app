import { CabinClass } from "@/types/flight";

export interface SearchHistoryEntry {
  id: string;
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
  tripType: "one-way" | "round-trip";
  searchedAt: string; // ISO
}
