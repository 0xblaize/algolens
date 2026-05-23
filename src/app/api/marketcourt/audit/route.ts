import { NextResponse } from "next/server";
import { keccak256, toUtf8Bytes } from "ethers";
import { getArcMarketById } from "@/src/lib/arc/market-registry";
import type { ArcMarket } from "@/src/lib/arc/types";

type AuditRequest = {
  marketId?: string;
  signal?: {
    id?: string;
    title?: string;
    summary?: string;
    confidence?: number;
    source?: string;
  };
  agentId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as AuditRequest;
  if (!body.marketId || !body.agentId) {
    return NextResponse.json({ error: "marketId and agentId are required" }, { status: 400 });
  }

  const market = await getArcMarketById(body.marketId);
  if (!market) {
    return NextResponse.json({ error: "Arc testnet market not found or registry not configured" }, { status: 404 });
  }

  const audit = runMarketCourtAudit(market, body.signal);
  const reasoningHash = keccak256(
    toUtf8Bytes(JSON.stringify({ marketId: body.marketId, agentId: body.agentId, audit })),
  );

  return NextResponse.json({
    ...audit,
    reasoningHash,
    signalHash: body.signal?.id ? keccak256(toUtf8Bytes(body.signal.id)) : keccak256(toUtf8Bytes("unconfigured-signal")),
  });
}

function runMarketCourtAudit(market: ArcMarket, signal: AuditRequest["signal"]) {
  const flags: string[] = [];
  if (market.question.length < 20) flags.push("Question may be underspecified");
  if (!market.resolutionSource) flags.push("Missing resolution source");
  if (Number(market.deadline) <= Math.floor(Date.now() / 1000)) flags.push("Deadline is not in the future");
  if (Number(market.liquidityHint) <= 0) flags.push("No liquidity hint on registry");
  if (!signal) flags.push("Signal payload not configured");

  const integrityScore = Math.max(20, 92 - flags.length * 14);
  const agentProbability = signal?.confidence ?? 50;
  const marketProbability = Math.max(20, Math.min(80, agentProbability - 8));
  const edgeBps = (agentProbability - marketProbability) * 100;
  const decision = integrityScore >= 75 ? "DEPLOY_TESTNET_ROUTE" : integrityScore >= 55 ? "WATCHLIST" : "REJECT";

  return {
    bullArgument: `The market "${market.question}" has a defined category and can be evaluated against its stated resolution source.`,
    bearArgument:
      flags.length > 0
        ? `Risk flags found: ${flags.join(", ")}.`
        : "No major ambiguity flags found in registry metadata.",
    judgeSummary: "MarketCourt combined registry metadata, signal quality, and liquidity hints into a testnet-only verdict.",
    integrityScore,
    agentProbability,
    marketProbability,
    edgeBps,
    riskFlags: flags,
    decision,
  };
}
