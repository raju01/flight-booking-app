import { CabinClass } from "@/types/flight";
import { TravelerCounts } from "@/types/traveler";

export interface SearchHistoryEntry {
  id: string;
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  passengers: number;
  travelers?: TravelerCounts; // missing on entries saved before children were remembered
  cabinClass: CabinClass;
  tripType: "one-way" | "round-trip";
  searchedAt: string; // ISO
}
