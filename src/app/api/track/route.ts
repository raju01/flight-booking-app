import { NextRequest } from "next/server";

const MAX_FIELDS = 12;
const MAX_VALUE_LENGTH = 80;

// Writes one JSON line per event to the server log, where Vercel's log view can filter on
// `"type":"skybook_event"`. Values are trimmed and only plain scalars are kept.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) return new Response(null, { status: 400 });

  const event: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(body).slice(0, MAX_FIELDS)) {
    if (!/^[a-zA-Z_]{1,24}$/.test(key)) continue;
    if (typeof value === "string") event[key] = value.slice(0, MAX_VALUE_LENGTH);
    else if (typeof value === "number" && Number.isFinite(value)) event[key] = value;
    else if (typeof value === "boolean") event[key] = value;
  }
  console.log(JSON.stringify({ type: "skybook_event", at: new Date().toISOString(), ...event }));
  return new Response(null, { status: 204 });
}
