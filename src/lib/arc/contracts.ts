import { Contract, JsonRpcProvider } from "ethers";
import { MARKET_REGISTRY_ABI, RECEIPT_REGISTRY_ABI } from "./abis";
import { getArcConfig } from "./config";

export function getArcProvider() {
  const { rpcUrl } = getArcConfig();
  if (!rpcUrl) {
    return null;
  }
  return new JsonRpcProvider(rpcUrl);
}

export function getMarketRegistryContract() {
  const config = getArcConfig();
  const provider = getArcProvider();
  if (!provider || !config.marketRegistryAddress) {
    return null;
  }
  return new Contract(config.marketRegistryAddress, MARKET_REGISTRY_ABI, provider);
}

export function getReceiptRegistryContract() {
  const config = getArcConfig();
  const provider = getArcProvider();
  if (!provider || !config.receiptRegistryAddress) {
    return null;
  }
  return new Contract(config.receiptRegistryAddress, RECEIPT_REGISTRY_ABI, provider);
}
