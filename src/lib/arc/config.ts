export type ArcConfig = {
  chainId?: string;
  rpcUrl?: string;
  marketRegistryAddress?: string;
  receiptRegistryAddress?: string;
  subgraphUrl?: string;
};

export function getArcConfig(): ArcConfig {
  return {
    chainId: process.env.NEXT_PUBLIC_ARC_CHAIN_ID,
    rpcUrl: process.env.NEXT_PUBLIC_ARC_RPC_URL ?? process.env.ARC_RPC_URL,
    marketRegistryAddress: process.env.NEXT_PUBLIC_MARKET_REGISTRY_ADDRESS,
    receiptRegistryAddress: process.env.NEXT_PUBLIC_RECEIPT_REGISTRY_ADDRESS,
    subgraphUrl: process.env.NEXT_PUBLIC_SUBGRAPH_URL ?? process.env.ARC_SUBGRAPH_URL,
  };
}

export function getMissingArcMarketConfig(config = getArcConfig()) {
  const required: Array<[string, string | undefined]> = [
    ["NEXT_PUBLIC_ARC_RPC_URL", config.rpcUrl],
    ["NEXT_PUBLIC_MARKET_REGISTRY_ADDRESS", config.marketRegistryAddress],
  ];
  return required.filter(([, value]) => !value).map(([key]) => key);
}

export function getMissingArcReceiptConfig(config = getArcConfig()) {
  const required: Array<[string, string | undefined]> = [
    ["NEXT_PUBLIC_ARC_RPC_URL", config.rpcUrl],
    ["NEXT_PUBLIC_RECEIPT_REGISTRY_ADDRESS", config.receiptRegistryAddress],
  ];
  return required.filter(([, value]) => !value).map(([key]) => key);
}

export function getMissingArcWriteConfig() {
  const config = getArcConfig();
  const missing: string[] = [];
  if (!config.rpcUrl) missing.push("NEXT_PUBLIC_ARC_RPC_URL");
  if (!config.receiptRegistryAddress) missing.push("NEXT_PUBLIC_RECEIPT_REGISTRY_ADDRESS");
  if (!process.env.ARC_PRIVATE_KEY_TESTNET) missing.push("ARC_PRIVATE_KEY_TESTNET");
  return missing;
}
