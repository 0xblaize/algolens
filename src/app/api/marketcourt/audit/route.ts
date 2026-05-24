import { NextResponse } from "next/server";
import { keccak256, toUtf8Bytes } from "ethers";
import { getArcMarketById } from "@/src/lib/arc/market-registry";
import { runGeminiAudit } from "@/src/lib/ai/gemini";

/**
 * POST /api/marketcourt/audit
 *
 * Server-side only. Calls Gemini to run a MarketCourt audit.
 * GEMINI_API_KEY never leaves the server — it is read in src/lib/ai/gemini.ts.
 *
 * Request body:
 *   { marketId: string, agentId: string, signal?: SignalPayload }
 *
 * On success:  200 + AuditResult JSON
 * On failure:  4xx/500 + { error: string }  — always a provider or validation error, never synthetic audit data
 */

type SignalPayload = {
  id?: string;
  title?: string;
  summary?: string;
  confidence?: number;
  source?: string;
};

type AuditRequest = {
  marketId?: string;
  agentId?: string;
  signal?: SignalPayload;
};

export async function POST(request: Request) {
  // ── 1. Parse and validate request ───────────────────────────────────────────
  let body: AuditRequest;
  try {
    body = (await request.json()) as AuditRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.marketId || !body.agentId) {
    return NextResponse.json(
      { error: "marketId and agentId are required" },
      { status: 400 },
    );
  }

  // ── 2. Resolve market from Arc registry ──────────────────────────────────────
  const market = await getArcMarketById(body.marketId);
  if (!market) {
    return NextResponse.json(
      { error: "Arc testnet market not found or registry pending configuration" },
      { status: 404 },
    );
  }

  // ── 3. Run Gemini audit (server-only, key never exposed) ─────────────────────
  let audit;
  try {
    audit = await runGeminiAudit(
      {
        marketId: market.marketId,
        question: market.question,
        category: market.category,
        resolutionSource: market.resolutionSource,
        deadline: market.deadline,
        impliedProbability: market.impliedProbability,
        liquidityHint: market.liquidityHint,
      },
      body.signal,
    );
  } catch (err: unknown) {
    // Surface the error exactly as thrown — the message already contains
    // the user-facing copy ("Gemini audit failed. Check API key or model config.")
    const message =
      err instanceof Error
        ? err.message
        : "Gemini audit failed. Check API key or model config.";

    console.error("[/api/marketcourt/audit] Gemini error:", message);

    return NextResponse.json({ error: message }, { status: 502 });
  }

  // ── 4. Hash the reasoning for on-chain receipt storage ───────────────────────
  const reasoningHash = keccak256(
    toUtf8Bytes(
      JSON.stringify({
        marketId: body.marketId,
        agentId: body.agentId,
        provider: process.env.AI_PROVIDER ?? "gemini",
        model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
        audit,
      }),
    ),
  );

  const signalHash = body.signal?.id
    ? keccak256(toUtf8Bytes(body.signal.id))
    : keccak256(toUtf8Bytes("no-signal"));

  // ── 5. Return result ──────────────────────────────────────────────────────────
  return NextResponse.json({
    ...audit,
    reasoningHash,
    signalHash,
  });
}
