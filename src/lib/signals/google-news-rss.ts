/**
 * src/lib/signals/google-news-rss.ts
 *
 * Google News RSS signal provider.
 * No API key required. Public RSS feed.
 *
 * IMPORTANT — Read-only public information analysis only.
 * Do NOT use signals to place trades, move funds, execute orders,
 * or create betting actions of any kind.
 */

import type { PublicSignal } from "./types";
import { deriveCategory, calcConfidence, calcUrgency } from "./gdelt";

const RSS_BASE = "https://news.google.com/rss/search";

const QUERY = [
  "market integrity",
  "macro economy",
  "inflation",
  "central bank",
  "stablecoin",
  "USDC",
  "financial regulation",
  "ETF",
  "election polling",
]
  .map((t) => `"${t}"`)
  .join(" OR ");

/** Fetch signals from Google News RSS. Throws on network/timeout/parse error. */
export async function fetchGoogleNewsRssSignals(): Promise<PublicSignal[]> {
  const url = new URL(RSS_BASE);
  url.searchParams.set("q", QUERY);
  url.searchParams.set("hl", "en-US");
  url.searchParams.set("gl", "US");
  url.searchParams.set("ceid", "US:en");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000); // 6-second timeout

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Accept": "application/rss+xml, application/xml, text/xml",
        "User-Agent": "AgoraLens/1.0 (public news aggregator)",
      },
    });

    if (!res.ok) {
      throw new Error(`Google News RSS HTTP ${res.status}`);
    }

    const xml = await res.text();
    const items = parseRssItems(xml);

    return items
      .filter((item) => item.title && item.link)
      .slice(0, 20)
      .map((item, i): PublicSignal => {
        const category = deriveCategory(item.title + " " + item.description);
        return {
          id: `rss-${i}-${hashSlice(item.link)}`,
          title: cleanTitle(item.title),
          source: item.sourceName || extractDomain(item.link),
          url: item.link,
          publishedAt: parsePubDate(item.pubDate),
          summary: buildSummary(item.title, item.description, category),
          category,
          confidence: calcConfidence(parsePubDate(item.pubDate), item.title),
          urgency: calcUrgency(parsePubDate(item.pubDate)),
          provider: "Google News RSS",
        };
      });
  } finally {
    clearTimeout(timeout);
  }
}

// ── RSS XML parser (no external library) ─────────────────────────────────────

type RssItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  sourceName: string;
};

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    items.push({
      title: extractTag(block, "title"),
      link: extractTag(block, "link") || extractAttrLink(block),
      pubDate: extractTag(block, "pubDate"),
      description: stripHtml(extractTag(block, "description")),
      sourceName: extractSourceName(block),
    });
  }

  return items;
}

/** Extract text content of a tag, handling CDATA. */
function extractTag(xml: string, tag: string): string {
  // CDATA variant
  const cdata = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    "i",
  ).exec(xml);
  if (cdata) return cdata[1].trim();

  // Plain text variant
  const plain = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i").exec(xml);
  if (plain) return plain[1].trim();

  return "";
}

/** Google News RSS sometimes has <link> as a self-closing tag or between CDATA. */
function extractAttrLink(xml: string): string {
  const m = /<link\s+href="([^"]+)"/i.exec(xml);
  return m ? m[1] : "";
}

/** Extract <source url="...">Name</source> */
function extractSourceName(xml: string): string {
  const m = /<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/i.exec(xml);
  return m ? m[1].trim() : "";
}

/** Strip basic HTML tags from description. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}

/** Google News titles end with " - Source Name". Strip the suffix. */
function cleanTitle(title: string): string {
  const idx = title.lastIndexOf(" - ");
  return idx > 20 ? title.slice(0, idx).trim() : title;
}

/** Parse RSS pubDate "Fri, 23 May 2025 12:00:00 GMT" → ISO string. */
function parsePubDate(pubDate: string): string {
  if (!pubDate) return new Date().toISOString();
  const d = new Date(pubDate);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "news.google.com";
  }
}

function buildSummary(title: string, description: string, category: string): string {
  const desc = description.slice(0, 120).trim();
  if (desc) return desc + (description.length > 120 ? "…" : "");
  return `${category} signal via Google News RSS. "${title.slice(0, 80)}${title.length > 80 ? "…" : ""}".`;
}

function hashSlice(url: string): string {
  return url.slice(-12).replace(/[^a-z0-9]/gi, "x");
}
