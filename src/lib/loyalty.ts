import { LoyaltyState, LoyaltyTransaction, LoyaltyTier, TierInfo } from "@/types/loyalty";

const STORAGE_KEY = "skybook_loyalty";
const POINTS_PER_RUPEE = 0.02; // 2 points per ₹100 spent

const TIER_THRESHOLDS: { tier: LoyaltyTier; minPoints: number }[] = [
  { tier: "Platinum", minPoints: 4000 },
  { tier: "Gold", minPoints: 1500 },
  { tier: "Silver", minPoints: 0 },
];

export function pointsForBooking(totalPrice: number): number {
  return Math.round(totalPrice * POINTS_PER_RUPEE);
}

export function loadLoyaltyState(): LoyaltyState {
  if (typeof window === "undefined") return { totalPoints: 0, transactions: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { totalPoints: 0, transactions: [] };
    const parsed = JSON.parse(raw) as LoyaltyState;
    return parsed.totalPoints !== undefined ? parsed : { totalPoints: 0, transactions: [] };
  } catch {
    return { totalPoints: 0, transactions: [] };
  }
}

export function addLoyaltyTransaction(description: string, points: number): LoyaltyState {
  const current = loadLoyaltyState();
  const transaction: LoyaltyTransaction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    description,
    points,
  };
  const next: LoyaltyState = {
    totalPoints: current.totalPoints + points,
    transactions: [transaction, ...current.transactions].slice(0, 50),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private browsing, etc.) — points just won't persist
  }
  return next;
}

export function tierForPoints(totalPoints: number): TierInfo {
  const sorted = TIER_THRESHOLDS;
  const currentIndex = sorted.findIndex((t) => totalPoints >= t.minPoints);
  const current = sorted[currentIndex];
  const next = currentIndex > 0 ? sorted[currentIndex - 1] : null;

  return {
    tier: current.tier,
    nextTier: next?.tier ?? null,
    pointsForNextTier: next ? next.minPoints - totalPoints : null,
  };
}
