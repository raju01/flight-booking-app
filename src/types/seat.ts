export type SeatColumnType = "window" | "middle" | "aisle";

export interface Seat {
  id: string; // e.g. "12A"
  row: number;
  column: string;
  type: SeatColumnType;
  occupied: boolean;
  priceDelta: number; // 0 = standard, >0 = extra legroom / front row premium
  isExtraLegroom: boolean;
}

export interface SeatLayout {
  rows: number;
  columns: string[]; // e.g. ["A","B","C","D","E","F"] with aisle gap rendered between groups
  aisleAfterColumnIndex: number; // index after which an aisle gap is rendered
  seats: Seat[];
}

/** key: `${legIndex}-${passengerIndex}` -> seat id */
export type SeatSelectionMap = Record<string, string>;
