export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export function timeOfDayRange(period: TimeOfDay): [number, number] {
  switch (period) {
    case "morning":
      return [5, 12];
    case "afternoon":
      return [12, 17];
    case "evening":
      return [17, 21];
    case "night":
      return [21, 5];
  }
}
