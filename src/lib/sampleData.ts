// Sample (generated) fares are for developing on a laptop. A live site must never show them as if they
// were real, so they are off in production unless ALLOW_SAMPLE_DATA=true, and on everywhere else unless
// ALLOW_SAMPLE_DATA=false. The browser can't see the private variable, so there the default rule applies.
export function sampleDataAllowed(): boolean {
  const override = process.env.ALLOW_SAMPLE_DATA?.trim().toLowerCase();
  if (override === "true") return true;
  if (override === "false") return false;
  return process.env.NODE_ENV !== "production";
}
