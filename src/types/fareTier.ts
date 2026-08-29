export type FareTierId = "saver" | "flexi" | "flexiPlus";

export interface FareTier {
  id: FareTierId;
  name: string;
  priceDelta: number;
  cabinBaggageKg: number;
  checkInBaggageKg: number;
  cancellationFee: number | "free";
  dateChangeFee: number | "free";
  seatSelection: "chargeable" | "free";
  mealIncluded: boolean;
}
