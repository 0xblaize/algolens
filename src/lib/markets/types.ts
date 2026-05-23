export type ExternalMarket = {
  externalMarketId: string;
  platform: "Polymarket";
  question: string;
  category: string;
  resolutionSource: string;
  deadline: string;
  impliedProbability: number;
  liquidity: number;
  volume: number;
  marketUrl: string;
  metadataHash: string;
};

export type ExternalMarketState =
  | { status: "configured"; markets: ExternalMarket[]; source: "Polymarket" }
  | { status: "empty"; message: string; source: "Polymarket" }
  | { status: "not-configured"; message: string; missing: string[] }
  | { status: "error"; message: string; detail?: string };
