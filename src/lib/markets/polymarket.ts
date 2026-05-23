import { keccak256, toUtf8Bytes } from "ethers";
import type { ExternalMarket, ExternalMarketState } from "./types";

const DEFAULT_GAMMA_URL = "https://gamma-api.polymarket.com/markets";

type PolymarketRawMarket = {
  id?: string | number;
  conditionId?: string;
  question?: string;
  title?: string;
  slug?: string;
  category?: string;
  resolutionSource?: string;
  endDate?: string;
  endDateIso?: string;
  closed?: boolean;
  active?: boolean;
  archived?: boolean;
  liquidity?: string | number;
  liquidityNum?: string | number;
  volume?: string | number;
  volumeNum?: string | number;
  outcomes?: unknown;
  outcomePrices?: unknown;
};

export async function getPolymarketMarkets(): Promise<ExternalMarketState> {
  const endpoint = process.env.POLYMARKET_GAMMA_API_URL ?? DEFAULT_GAMMA_URL;

  try {
    const url = new URL(endpoint);
    url.searchParams.set("active", "true");
    url.searchParams.set("closed", "false");
    url.searchParams.set("archived", "false");
    url.searchParams.set("limit", "25");
    url.searchParams.set("order", "volume");
    url.searchParams.set("ascending", "false");

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return {
        status: "error",
        message: "Could not load external markets.",
        detail: `Polymarket responded with ${response.status}`,
      };
    }

    const payload = (await response.json()) as unknown;
    const rawMarkets = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { markets?: unknown[] }).markets)
        ? (payload as { markets: unknown[] }).markets
        : [];

    const markets = rawMarkets
      .map((raw) => normalizePolymarketMarket(raw as PolymarketRawMarket))
      .filter((market): market is ExternalMarket => Boolean(market));

    if (markets.length === 0) {
      return {
        status: "empty",
        source: "Polymarket",
        message: "No open Polymarket markets were returned by the live source.",
      };
    }

    return { status: "configured", source: "Polymarket", markets };
  } catch (error) {
    return {
      status: "error",
      message: "Could not load external markets.",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function normalizePolymarketMarket(raw: PolymarketRawMarket): ExternalMarket | null {
  if (raw.closed || raw.archived || raw.active === false) return null;

  const question = String(raw.question ?? raw.title ?? "").trim();
  const externalMarketId = String(raw.conditionId ?? raw.id ?? "").trim();
  if (!question || !externalMarketId) return null;

  const slug = String(raw.slug ?? externalMarketId);
  const deadline = toUnixSeconds(raw.endDateIso ?? raw.endDate);
  if (deadline <= Math.floor(Date.now() / 1000)) return null;

  const liquidity = toNumber(raw.liquidityNum ?? raw.liquidity);
  const volume = toNumber(raw.volumeNum ?? raw.volume);
  const category = String(raw.category ?? "Prediction Market");
  const resolutionSource = String(raw.resolutionSource ?? "Polymarket market page");
  const marketUrl = `https://polymarket.com/event/${slug}`;
  const impliedProbability = getImpliedProbability(raw.outcomes, raw.outcomePrices);
  const metadataHash = keccak256(
    toUtf8Bytes(
      JSON.stringify({
        externalMarketId,
        platform: "Polymarket",
        question,
        category,
        resolutionSource,
        deadline,
        impliedProbability,
        liquidity,
        marketUrl,
      }),
    ),
  );

  return {
    externalMarketId,
    platform: "Polymarket",
    question,
    category,
    resolutionSource,
    deadline: String(deadline),
    impliedProbability,
    liquidity,
    volume,
    marketUrl,
    metadataHash,
  };
}

function toUnixSeconds(value: unknown): number {
  if (!value) return 0;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return 0;
  return Math.floor(date.getTime() / 1000);
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseMaybeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function getImpliedProbability(outcomes: unknown, prices: unknown): number {
  const parsedOutcomes = parseMaybeArray(outcomes);
  const parsedPrices = parseMaybeArray(prices).map(Number);
  if (parsedPrices.length === 0) return 0;

  const yesIndex = parsedOutcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
  const selectedPrice = parsedPrices[yesIndex >= 0 ? yesIndex : 0] ?? parsedPrices[0] ?? 0;
  return Math.round(Math.max(0, Math.min(1, selectedPrice)) * 100);
}
