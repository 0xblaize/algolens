import { NextResponse } from "next/server";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { RECEIPT_REGISTRY_ABI } from "@/src/lib/arc/abis";
import { getArcConfig, getMissingArcWriteConfig } from "@/src/lib/arc/config";

/**
 * POST /api/execution/write-receipt
 *
 * Writes a reasoning receipt to ReasoningReceiptRegistry on Arc Testnet.
 * Server-side only — ARC_RPC_URL and ARC_PRIVATE_KEY_TESTNET never leave the server.
 *
 * Testnet only. No real funds. No trades. No orders.
 * This writes an immutable AI reasoning audit trail on-chain only.
 */

type WriteReceiptRequest = {
  agentId?: string;
  marketId?: string;
  signalHash?: string;
  reasoningHash?: string;
  integrityScore?: number;
  agentProbability?: number;
  marketProbability?: number;
  edgeBps?: number;
  suggestedUsdcAmount?: string;
  decision?: string;
};

const EXPLORER_BASE =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";

export async function POST(request: Request) {
  // ── 1. Validate server config ─────────────────────────────────────────────
  const missing = getMissingArcWriteConfig();
  if (missing.length) {
    const hasKey = missing.includes("ARC_PRIVATE_KEY_TESTNET");
    const hasRegistry = missing.includes("NEXT_PUBLIC_RECEIPT_REGISTRY_ADDRESS");
    return NextResponse.json(
      {
        error: hasKey
          ? "ARC_PRIVATE_KEY_TESTNET missing. Cannot write to Arc Testnet."
          : hasRegistry
          ? "ReceiptRegistry address pending configuration."
          : "Arc testnet receipt writing is pending configuration.",
        missing,
      },
      { status: 400 },
    );
  }

  // ── 2. Validate request body ──────────────────────────────────────────────
  let body: WriteReceiptRequest;
  try {
    body = (await request.json()) as WriteReceiptRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const required: (keyof WriteReceiptRequest)[] = [
    "agentId",
    "marketId",
    "signalHash",
    "reasoningHash",
    "integrityScore",
    "agentProbability",
    "marketProbability",
    "edgeBps",
    "suggestedUsdcAmount",
    "decision",
  ];
  const missingFields = required.filter(
    (f) => body[f] === undefined || body[f] === "",
  );
  if (missingFields.length) {
    return NextResponse.json(
      { error: "Missing receipt fields", missingFields },
      { status: 400 },
    );
  }

  // ── 3. Write receipt to Arc Testnet ───────────────────────────────────────
  try {
    const config = getArcConfig();
    const provider = new JsonRpcProvider(config.rpcUrl!);
    const wallet = new Wallet(process.env.ARC_PRIVATE_KEY_TESTNET!, provider);
    const contract = new Contract(
      config.receiptRegistryAddress!,
      RECEIPT_REGISTRY_ABI,
      wallet,
    );

    const tx = await contract.writeReceipt(
      body.agentId,
      BigInt(body.marketId as string),
      body.signalHash,
      body.reasoningHash,
      body.integrityScore,
      body.agentProbability,
      body.marketProbability,
      body.edgeBps,
      BigInt(Math.round(Number(body.suggestedUsdcAmount ?? "0") * 1e6)), // USDC 6 decimals
      body.decision,
    );

    const receipt = await tx.wait();
    const txHash: string = receipt?.hash ?? tx.hash;

    // ── 4. Parse receiptId from ReceiptWritten event ──────────────────────
    let receiptId: string | null = null;
    if (receipt?.logs) {
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "ReceiptWritten") {
            receiptId = parsed.args.receiptId?.toString() ?? null;
            break;
          }
        } catch {
          // log from a different contract — skip
        }
      }
    }

    return NextResponse.json({
      receiptId,
      txHash,
      explorerUrl: `${EXPLORER_BASE}/tx/${txHash}`,
      marketId: body.marketId,
      agentId: body.agentId,
      integrityScore: body.integrityScore,
      decision: body.decision,
      reasoningHash: body.reasoningHash,
      mode: "testnet-only",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[write-receipt] Arc Testnet error:", detail);
    return NextResponse.json(
      { error: "Receipt write failed on Arc Testnet.", detail },
      { status: 500 },
    );
  }
}
