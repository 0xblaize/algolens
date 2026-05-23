/**
 * src/lib/signals/gdelt.ts
 *
 * GDELT 2.0 DOC API signal provider.
 * No API key required. Free public API by gdeltproject.org.
 *
 * IMPORTANT — Read-only public information analysis only.
 * Do NOT use signals to place trades, move funds, execute orders,
 * or create betting actions of any kind.
 */

import type { PublicSignal, SignalUrgency } from "./types";

const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";

// Safe public-information query topics (AgoraLens domain)
const QUERY = [
  '"market integrity"',
  '"macro economy"',
  '"inflation report"',
  '"central bank"',
  "stablecoin",
  "USDC",
  '"financial regulation"',
  '"ETF flows"',
  '"election polling"',
].join(" OR ");

type GdeltArticle = {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
};

type GdeltResponse = {
  articles?: GdeltArticle[];
  status?: string;
};

/** Fetch signals from GDELT. Throws on network/timeout/parse error. */
export async function fetchGdeltSignals(): Promise<PublicSignal[]> {
  const url = new URL(GDELT_ENDPOINT);
  url.searchParams.set("query", QUERY);
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("maxrecords", "25");
  url.searchParams.set("sort", "DateDesc");
  url.searchParams.set("timespan", "48h");
  url.searchParams.set("format", "json");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000); // 7-second hard timeout

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`GDELT HTTP ${res.status}`);
    }

    const data = (await res.json()) as GdeltResponse;
    const articles = data.articles ?? [];

    return articles
      .filter(
        (a): a is GdeltArticle & { url: string; title: string } =>
          !!a.url && !!a.title && a.language === "English",
      )
      .slice(0, 20)
      .map((a, i): PublicSignal => {
        const publishedAt = parseGdeltDate(a.seendate ?? "");
        const category = deriveCategory(a.title);
        return {
          id: `gdelt-${i}-${hashSlice(a.url)}`,
          title: a.title,
          source: a.domain ?? "gdeltproject.org",
          url: a.url,
          publishedAt,
          summary: buildSummary(a.title, a.domain ?? "", category),
          category,
          confidence: calcConfidence(publishedAt, a.title),
          urgency: calcUrgency(publishedAt),
          provider: "GDELT",
        };
      });
  } finally {
    clearTimeout(timeout);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse GDELT seendate "20240523T120000Z" → ISO string. */
function parseGdeltDate(seendate: string): string {
  if (!seendate || seendate.length < 15) return new Date().toISOString();
  const y = seendate.slice(0, 4);
  const mo = seendate.slice(4, 6);
  const d = seendate.slice(6, 8);
  const h = seendate.slice(9, 11);
  const mi = seendate.slice(11, 13);
  const s = seendate.slice(13, 15);
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

export function deriveCategory(text: string): string {
  const t = text.toLowerCase();
  if (/stablecoin|usdc|circle|crypto|defi|bitcoin|ethereum|web3|blockchain/.test(t))
    return "Crypto";
  if (
    /inflation|cpi|fed|federal reserve|central bank|interest rate|gdp|monetary|boe|ecb|rba/.test(
      t,
    )
  )
    return "Macro";
  if (/election|polling|politics|vote|president|congress|senate|campaign/.test(t))
    return "Politics";
  if (/sec|regulation|regulatory|compliance|market integrity|etf|enforcement|law|legal/.test(t))
    return "Regulation";
  if (/arc|polymarket|prediction market|kalshi|manifold/.test(t)) return "Markets";
  return "Finance";
}

export function calcConfidence(publishedAt: string, text: string): number {
  const ageHrs = (Date.now() - new Date(publishedAt).getTime()) / 3_600_000;
  const recency = Math.max(0, 20 - Math.min(20, ageHrs));
  const terms = [
    "inflation",
    "central bank",
    "stablecoin",
    "usdc",
    "regulation",
    "etf",
    "market integrity",
    "macro",
    "election",
    "fed",
  ];
  const matches = terms.filter((t) => text.toLowerCase().includes(t)).length;
  return Math.min(95, 55 + Math.round(recency) + Math.min(15, matches * 5));
}

export function calcUrgency(publishedAt: string): SignalUrgency {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  if (ageMs < 3 * 3_600_000) return "high";
  if (ageMs < 24 * 3_600_000) return "medium";
  return "low";
}

function buildSummary(title: string, domain: string, category: string): string {
  return `${category} signal via GDELT. "${title.slice(0, 80)}${title.length > 80 ? "…" : ""}" — sourced from ${domain}.`;
}

function hashSlice(url: string): string {
  return url.slice(-12).replace(/[^a-z0-9]/gi, "x");
}
