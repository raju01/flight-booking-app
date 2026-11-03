// A small key-value store shared by every server instance: Upstash Redis (or Vercel KV) over its REST API
// when its address and token are set. Without one, values live in this server's memory, which a serverless
// host clears whenever it recycles the instance, so they are only best-effort then.
//
// Anything kept here is a cache: a failed read or write is logged and treated as a miss, never an error.

import { after } from "next/server";

const MAX_LOCAL_ENTRIES = 1000;
const local = new Map<string, { until: number; raw: string }>();

function redis(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function redisCommand(command: (string | number)[], timeoutMs: number): Promise<unknown> {
  const store = redis();
  if (!store) return null;
  // No cache option on purpose: API routes then always ask the store, and a page refreshed every few hours may keep
  // the answer until its next refresh. "no-store" would stop such pages from being prerendered at all.
  const res = await fetch(store.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${store.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return ((await res.json()) as { result?: unknown }).result ?? null;
}

export async function getJSON<T>(key: string): Promise<T | null> {
  let raw: string | null = null;
  try {
    // Short, so a slow store costs a search well under a second before it falls back to SerpApi.
    const result = await redisCommand(["GET", key], 800);
    if (typeof result === "string") raw = result;
  } catch (error) {
    console.error("Shared store unavailable, using server memory:", error);
  }
  if (raw === null) {
    const entry = local.get(key);
    if (entry && entry.until > Date.now()) raw = entry.raw;
  }
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const raw = JSON.stringify(value);
  if (local.size >= MAX_LOCAL_ENTRIES) local.delete(local.keys().next().value as string);
  local.set(key, { until: Date.now() + ttlSeconds * 1000, raw });
  try {
    await redisCommand(["SET", key, raw, "EX", Math.max(1, Math.round(ttlSeconds))], 2500);
  } catch (error) {
    console.error("Shared store: could not write:", error);
  }
}

// Runs a cache write after the response has been sent, so a slow store never delays a search. Outside a
// request (a build, a script) it simply runs on its own.
export function inBackground(task: Promise<unknown>): void {
  const safe = task.catch((error) => console.error("Shared store: background write failed:", error));
  try {
    after(() => safe);
  } catch {
    void safe;
  }
}
