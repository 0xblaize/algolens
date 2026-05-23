import { NextResponse } from "next/server";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { RECEIPT_REGISTRY_ABI } from "@/src/lib/arc/abis";
import { getArcConfig } from "@/src/lib/arc/config";

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

export async function POST(request: Request) {
  const config = getArcConfig();
  const missing = [
    ["NEXT_PUBLIC_ARC_RPC_URL", config.rpcUrl],
    ["NEXT_PUBLIC_RECEIPT_REGISTRY_ADDRESS", config.receiptRegistryAddress],
    ["ARC_PRIVATE_KEY_TESTNET", process.env.ARC_PRIVATE_KEY_TESTNET],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    return NextResponse.json(
      {
        error: "Arc testnet receipt writing is not configured.",
        missing,
        mode: "testnet-only",
      },
      { status: 400 },
    );
  }

  const body = (await request.json()) as WriteReceiptRequest;
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
  const missingFields = required.filter((field) => body[field] === undefined || body[field] === "");
  if (missingFields.length) {
    return NextResponse.json({ error: "Missing receipt fields", missingFields }, { status: 400 });
  }

  const provider = new JsonRpcProvider(config.rpcUrl);
  const wallet = new Wallet(process.env.ARC_PRIVATE_KEY_TESTNET as string, provider);
  const contract = new Contract(config.receiptRegistryAddress as string, RECEIPT_REGISTRY_ABI, wallet);

  const tx = await contract.writeReceipt(
    body.agentId,
    BigInt(body.marketId as string),
    body.signalHash,
    body.reasoningHash,
    body.integrityScore,
    body.agentProbability,
    body.marketProbability,
    body.edgeBps,
    BigInt(body.suggestedUsdcAmount as string),
    body.decision,
  );
  const receipt = await tx.wait();

  return NextResponse.json({
    mode: "testnet-only",
    txHash: receipt?.hash ?? tx.hash,
    receiptRegistry: config.receiptRegistryAddress,
  });
}
