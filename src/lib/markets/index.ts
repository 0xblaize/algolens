import { getPolymarketMarkets } from "./polymarket";
import type { ExternalMarketState } from "./types";

export async function getExternalMarkets(limit = 30): Promise<ExternalMarketState> {
  if (process.env.LIVE_MARKET_SOURCE === "disabled") {
    return {
      status: "not-configured",
      missing: ["LIVE_MARKET_SOURCE"],
      message: "Live market source not configured.",
    };
  }

  return getPolymarketMarkets(limit);
}
