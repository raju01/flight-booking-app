export type LoyaltyTier = "Silver" | "Gold" | "Platinum";

export interface LoyaltyTransaction {
  id: string;
  date: string; // ISO
  description: string;
  points: number;
}

export interface LoyaltyState {
  totalPoints: number;
  transactions: LoyaltyTransaction[];
}

export interface TierInfo {
  tier: LoyaltyTier;
  pointsForNextTier: number | null;
  nextTier: LoyaltyTier | null;
}
