/**
 * src/lib/signals/index.ts
 *
 * Signal orchestrator: GDELT → Google News RSS → Cache → Error.
 *
 * Provider flow:
 *  1. If cache is fresh (< 3 min), return immediately.
 *  2. Try GDELT. On success, cache and return.
 *  3. If GDELT fails or returns empty, try Google News RSS.
 *  4. If RSS succeeds, cache and return.
 *  5. If both fail, return stale cache as "Cached" source.
 *  6. If no cache exists, return clean error state.
 *
 * No NEWS_API_KEY required.
 * All external calls are server-side only — never call this from a client component.
 */

import { fetchGdeltSignals } from "./gdelt";
import { fetchGoogleNewsRssSignals } from "./google-news-rss";
import { isCacheFresh, readCache, writeCache } from "./cache";
import type { SignalDataState } from "./types";

export async function getPublicSignals(): Promise<SignalDataState> {
  // ── 1. Serve from fresh cache immediately ─────────────────────────────────
  if (isCacheFresh()) {
    const entry = readCache()!;
    return {
      status: "configured",
      signals: entry.signals,
      provider: entry.provider,
    };
  }

  // ── 2. Try GDELT (primary) ────────────────────────────────────────────────
  try {
    const signals = await fetchGdeltSignals();
    if (signals.length > 0) {
      writeCache(signals, "GDELT");
      return { status: "configured", signals, provider: "GDELT" };
    }
    // GDELT returned empty — fall through to RSS
  } catch {
    // Network/timeout/parse error — fall through to RSS
  }

  // ── 3. Try Google News RSS (fallback) ─────────────────────────────────────
  try {
    const signals = await fetchGoogleNewsRssSignals();
    if (signals.length > 0) {
      writeCache(signals, "Google News RSS");
      return { status: "configured", signals, provider: "Google News RSS" };
    }
    // RSS returned empty — fall through to cache
  } catch {
    // Network/timeout/parse error — fall through to cache
  }

  // ── 4. Use stale cache as last resort ─────────────────────────────────────
  const stale = readCache();
  if (stale && stale.signals.length > 0) {
    return {
      status: "configured",
      signals: stale.signals.map((s) => ({ ...s, provider: "Cached" as const })),
      provider: "Cached",
    };
  }

  // ── 5. Everything failed, no cache — return clean error state ─────────────
  return {
    status: "error",
    message: "Live signal providers unavailable. Try again later.",
    detail: "GDELT and Google News RSS both failed to return signals.",
  };
}
