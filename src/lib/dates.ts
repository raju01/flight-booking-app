// Calendar dates are plain "YYYY-MM-DD" strings in the visitor's local time. Parsing them with
// `new Date("YYYY-MM-DD")` would read them as UTC and shift the day, so these helpers build local dates.

export function parseISODate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso) ?? new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

// Local calendar date `days` from now as YYYY-MM-DD.
export function futureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
}
