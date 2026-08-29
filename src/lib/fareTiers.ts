import { FareTier } from "@/types/fareTier";
import { seededRandom, seedFromString } from "@/lib/seededRandom";

export function generateFareTiers(flightId: string, basePrice: number): FareTier[] {
  const rand = seededRandom(seedFromString(`faretier-${flightId}`));

  const saverDelta = 0;
  const flexiDelta = Math.round((300 + rand() * 500) / 10) * 10;
  const flexiPlusDelta = Math.round((900 + rand() * 700) / 10) * 10;

  return [
    {
      id: "saver",
      name: "Saver",
      priceDelta: saverDelta,
      cabinBaggageKg: 7,
      checkInBaggageKg: 15,
      cancellationFee: Math.round((basePrice * 0.35) / 10) * 10,
      dateChangeFee: Math.round((basePrice * 0.25) / 10) * 10,
      seatSelection: "chargeable",
      mealIncluded: false,
    },
    {
      id: "flexi",
      name: "Flexi",
      priceDelta: flexiDelta,
      cabinBaggageKg: 7,
      checkInBaggageKg: 20,
      cancellationFee: Math.round((basePrice * 0.15) / 10) * 10,
      dateChangeFee: Math.round((basePrice * 0.1) / 10) * 10,
      seatSelection: "chargeable",
      mealIncluded: true,
    },
    {
      id: "flexiPlus",
      name: "Flexi Plus",
      priceDelta: flexiPlusDelta,
      cabinBaggageKg: 10,
      checkInBaggageKg: 25,
      cancellationFee: "free",
      dateChangeFee: "free",
      seatSelection: "free",
      mealIncluded: true,
    },
  ];
}
