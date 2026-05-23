import { BigInt } from "@graphprotocol/graph-ts";
import {
  MarketCreated,
  MarketStatusUpdated,
} from "../../generated/MarketRegistry/MarketRegistry";
import {
  LifecycleUpdated,
  ReceiptWritten,
} from "../../generated/ReasoningReceiptRegistry/ReasoningReceiptRegistry";
import { Market, Receipt } from "../../generated/schema";

const MARKET_STATUSES = ["OPEN", "PAUSED", "RESOLVED", "CANCELLED"];
const LIFECYCLE_STATES = ["ENTRY", "MONITORING", "RESOLUTION_CHECK", "SETTLED", "REJECTED"];

export function handleMarketCreated(event: MarketCreated): void {
  const market = new Market(event.params.marketId.toString());
  market.marketId = event.params.marketId;
  market.question = event.params.question;
  market.category = event.params.category;
  market.resolutionSource = event.params.resolutionSource;
  market.resolutionSourceHash = event.params.resolutionSourceHash;
  market.deadline = event.params.deadline;
  market.createdAt = event.block.timestamp;
  market.status = "OPEN";
  market.creator = event.params.creator;
  market.liquidityHint = event.params.liquidityHint;
  market.marketType = event.params.marketType;
  market.save();
}

export function handleMarketStatusUpdated(event: MarketStatusUpdated): void {
  const market = Market.load(event.params.marketId.toString());
  if (!market) return;
  market.status = MARKET_STATUSES[event.params.status] || "OPEN";
  market.save();
}

export function handleReceiptWritten(event: ReceiptWritten): void {
  const receipt = new Receipt(event.params.receiptId.toString());
  receipt.receiptId = event.params.receiptId;
  receipt.agentId = event.params.agentId;
  receipt.marketId = event.params.marketId;
  receipt.signalHash = event.transaction.hash;
  receipt.reasoningHash = event.params.reasoningHash;
  receipt.integrityScore = event.params.integrityScore;
  receipt.agentProbability = 0;
  receipt.marketProbability = 0;
  receipt.edgeBps = BigInt.zero();
  receipt.suggestedUsdcAmount = BigInt.zero();
  receipt.decision = event.params.decision;
  receipt.lifecycleState = "ENTRY";
  receipt.timestamp = event.block.timestamp;
  receipt.txHash = event.transaction.hash;
  receipt.save();
}

export function handleLifecycleUpdated(event: LifecycleUpdated): void {
  const receipt = Receipt.load(event.params.receiptId.toString());
  if (!receipt) return;
  receipt.lifecycleState = LIFECYCLE_STATES[event.params.lifecycleState] || "ENTRY";
  receipt.save();
}
