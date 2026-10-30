import { CabinClass } from "@/types/flight";
import { TravelerCounts } from "@/types/traveler";

export interface FareAlert {
  id: string;
  from: string;
  to: string;
  date: string; // ISO
  cabinClass: CabinClass;
  savedPrice: number; // the lowest fare for everyone in `travelers` when the alert was saved
  travelers?: TravelerCounts; // absent on alerts saved before groups were supported (one traveller)
  createdAt: string; // ISO
}
