export function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function seedFromString(input: string): number {
  return input.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) || 1;
}

export function pad(n: number) {
  return n.toString().padStart(2, "0");
}
