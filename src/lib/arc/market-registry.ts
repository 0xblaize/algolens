import { getMissingArcMarketConfig } from "./config";
import { getMarketRegistryContract } from "./contracts";
import { fetchMarketsFromSubgraph } from "./subgraph";
import type { ArcDataState, ArcMarket, ArcMarketStatus } from "./types";

const MARKET_STATUSES: ArcMarketStatus[] = ["OPEN", "PAUSED", "RESOLVED", "CANCELLED"];

function normalizeMarket(raw: Record<string, unknown>): ArcMarket {
  const statusIndex = Number(raw.status ?? 0);
  return {
    marketId: String(raw.marketId ?? ""),
    question: String(raw.question ?? ""),
    category: String(raw.category ?? ""),
    resolutionSource: String(raw.resolutionSource ?? ""),
    resolutionSourceHash: String(raw.resolutionSourceHash ?? ""),
    deadline: String(raw.deadline ?? ""),
    createdAt: String(raw.createdAt ?? ""),
    status: MARKET_STATUSES[statusIndex] ?? "OPEN",
    creator: String(raw.creator ?? ""),
    liquidityHint: String(raw.liquidityHint ?? "0"),
    marketType: String(raw.marketType ?? ""),
    source: "rpc",
  };
}

export async function getArcMarkets(): Promise<ArcDataState<ArcMarket[]>> {
  try {
    const subgraphMarkets = await fetchMarketsFromSubgraph();
    if (subgraphMarkets) {
      if (subgraphMarkets.length === 0) {
        return {
          status: "empty",
          source: "subgraph",
          message: "No Arc testnet markets found. Deploy or create a testnet market to begin.",
        };
      }
      return { status: "configured", data: subgraphMarkets, source: "subgraph" };
    }

    const missing = getMissingArcMarketConfig();
    if (missing.length) {
      return {
        status: "not-configured",
        missing,
        message: "Arc testnet market registry is not configured.",
      };
    }

    const contract = getMarketRegistryContract();
    if (!contract) {
      return {
        status: "not-configured",
        missing,
        message: "Arc testnet market registry is not configured.",
      };
    }

    const rawMarkets = (await contract.getMarkets()) as Record<string, unknown>[];
    const markets = rawMarkets.map(normalizeMarket);
    if (markets.length === 0) {
      return {
        status: "empty",
        source: "rpc",
        message: "No Arc testnet markets found. Deploy or create a testnet market to begin.",
      };
    }

    return { status: "configured", data: markets, source: "rpc" };
  } catch (error) {
    return {
      status: "error",
      message: "Unable to load Arc testnet markets.",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getArcMarketById(marketId: string) {
  const state = await getArcMarkets();
  if (state.status !== "configured") {
    return null;
  }
  return state.data.find((market) => market.marketId === marketId) ?? null;
}
