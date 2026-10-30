// Per-client request limiter for the endpoints that spend SerpApi credits.
//
// State lives in this server instance's memory, so on a platform that runs several instances the
// effective limit is per instance. That still stops a single client hammering one endpoint, but it
// is not a hard global cap; use the SerpApi dashboard's usage limits for that.
const WINDOW_MS = 60_000;
const MAX_CLIENTS = 5000;

const hits = new Map<string, { windowStart: number; count: number }>();

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

// Returns the seconds to wait when the client is over its limit, or 0 when the request may proceed.
export function rateLimit(request: Request, scope: string, limitPerMinute: number): number {
  const key = `${scope}:${clientKey(request)}`;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    if (hits.size >= MAX_CLIENTS) {
      for (const [k, v] of hits) if (now - v.windowStart >= WINDOW_MS) hits.delete(k);
      if (hits.size >= MAX_CLIENTS) hits.clear();
    }
    hits.set(key, { windowStart: now, count: 1 });
    return 0;
  }

  entry.count += 1;
  return entry.count > limitPerMinute ? Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000) : 0;
}

export function tooManyRequests(retryAfterSeconds: number): Response {
  return Response.json(
    { error: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
