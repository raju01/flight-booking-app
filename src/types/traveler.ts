export type TravelerType = "adult" | "child" | "infant";

export interface TravelerCounts {
  adults: number;
  children: number;
  infants: number;
}

export function totalTravelers(counts: TravelerCounts): number {
  return counts.adults + counts.children + counts.infants;
}

export function travelerTypeList(counts: TravelerCounts): TravelerType[] {
  return [
    ...Array<TravelerType>(counts.adults).fill("adult"),
    ...Array<TravelerType>(counts.children).fill("child"),
    ...Array<TravelerType>(counts.infants).fill("infant"),
  ];
}
