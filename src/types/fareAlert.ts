import { CabinClass } from "@/types/flight";

export interface FareAlert {
  id: string;
  from: string;
  to: string;
  date: string; // ISO
  cabinClass: CabinClass;
  savedPrice: number;
  createdAt: string; // ISO
}
