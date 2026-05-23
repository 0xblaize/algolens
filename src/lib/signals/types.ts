/**
 * src/lib/signals/types.ts
 *
 * Signal types for AgoraLens Radar.
 * No API key is required — signals come from GDELT and Google News RSS.
 *
 * IMPORTANT: Signals are for public information analysis only.
 * Do not use signals to place trades, move funds, execute orders,
 * or create betting actions of any kind.
 */

/** Where the signal data was sourced from. */
export type SignalProvider = "GDELT" | "Google News RSS" | "Cached";

/** Urgency derived from article recency. */
export type SignalUrgency = "low" | "medium" | "high";

/**
 * A single public market intelligence signal.
 * Safe for display — does not contain API keys or private data.
 */
export type PublicSignal = {
  /** Stable unique ID for the signal (provider-namespaced). */
  id: string;
  /** Headline of the article. */
  title: string;
  /** Publication name or domain (e.g. "Reuters", "ft.com"). */
  source: string;
  /** Direct URL to the original article. */
  url: string;
  /** ISO 8601 publish timestamp. */
  publishedAt: string;
  /** Short summary of the article content. */
  summary: string;
  /** Topic category derived from keyword mapping. */
  category: string;
  /** 0–100 confidence score (recency + relevance). */
  confidence: number;
  /** Urgency based on how recently the article was published. */
  urgency: SignalUrgency;
  /** Which provider served this signal. */
  provider: SignalProvider;
};

/**
 * The state object passed from server pages to client views.
 * Uses a discriminated union so the UI can handle each state cleanly.
 */
export type SignalDataState =
  | {
      status: "configured";
      signals: PublicSignal[];
      /** Which provider successfully served this batch. */
      provider: SignalProvider;
    }
  | {
      /** Legacy: kept for backward compatibility — no longer returned in practice. */
      status: "not-configured";
      message: string;
      missing: string[];
    }
  | {
      status: "error";
      message: string;
      detail?: string;
    };
