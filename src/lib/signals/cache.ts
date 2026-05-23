/**
 * src/lib/signals/cache.ts
 *
 * In-process module-level cache for live signals.
 * Persists across requests within the same Next.js server process.
 * Resets on dev server restart or deployment.
 *
 * Strategy:
 *  - "Fresh" cache (< 3 min old) → served immediately without hitting providers
 *  - "Stale" cache → used as last-resort fallback when all providers fail
 */

import type { PublicSignal, SignalProvider } from "./types";

const FRESH_TTL_MS = 3 * 60 * 1000; // 3 minutes

export type CacheEntry = {
  signals: PublicSignal[];
  provider: Exclude<SignalProvider, "Cached">;
  fetchedAt: number;
};

let _cache: CacheEntry | null = null;

/** True if cache exists and is still within the fresh window. */
export function isCacheFresh(): boolean {
  return !!_cache && Date.now() - _cache.fetchedAt < FRESH_TTL_MS;
}

/** Read the cache regardless of freshness (used as error fallback). */
export function readCache(): CacheEntry | null {
  return _cache;
}

/** Write a successful fetch result to the cache. */
export function writeCache(
  signals: PublicSignal[],
  provider: Exclude<SignalProvider, "Cached">,
): void {
  _cache = { signals, provider, fetchedAt: Date.now() };
}
