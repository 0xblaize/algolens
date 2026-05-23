import { NextResponse } from "next/server";
import { Contract, Wallet, getAddress } from "ethers";
import { MARKET_REGISTRY_ABI } from "@/src/lib/arc/abis";
import { getArcConfig, getMissingArcMarketConfig } from "@/src/lib/arc/config";
import { getArcProvider } from "@/src/lib/arc/contracts";

type ImportMarketRequest = {
  externalMarketId?: string;
  platform?: string;
  question?: string;
  category?: string;
  resolutionSource?: string;
  deadline?: string;
  impliedProbability?: number;
  liquidity?: number;
  marketUrl?: string;
  metadataHash?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ImportMarketRequest;
  const missingFields = [
    "externalMarketId",
    "platform",
    "question",
    "category",
    "resolutionSource",
    "deadline",
    "marketUrl",
    "metadataHash",
  ].filter((field) => !body[field as keyof ImportMarketRequest]);

  if (missingFields.length) {
    return NextResponse.json(
      { error: `Missing market metadata: ${missingFields.join(", ")}` },
      { status: 400 },
    );
  }

  const missingConfig = getMissingArcMarketConfig();
  if (missingConfig.length || !process.env.ARC_PRIVATE_KEY_TESTNET) {
    return NextResponse.json(
      {
        error: "Arc testnet import is not configured.",
        missing: [...missingConfig, ...(process.env.ARC_PRIVATE_KEY_TESTNET ? [] : ["ARC_PRIVATE_KEY_TESTNET"])],
      },
      { status: 400 },
    );
  }

  const { marketRegistryAddress } = getArcConfig();
  const provider = getArcProvider();
  if (!provider || !marketRegistryAddress) {
    return NextResponse.json(
      { error: "Arc testnet provider or MarketRegistry address is unavailable." },
      { status: 400 },
    );
  }

  try {
    const signer = new Wallet(process.env.ARC_PRIVATE_KEY_TESTNET, provider);
    const contract = new Contract(
      getAddress(marketRegistryAddress),
      MARKET_REGISTRY_ABI,
      signer,
    );

    const tx = await contract.importExternalMarket(
      body.externalMarketId,
      body.platform,
      body.question,
      body.category,
      body.resolutionSource,
      BigInt(body.deadline ?? "0"),
      BigInt(Math.max(0, Math.round(body.liquidity ?? 0))),
      Math.max(0, Math.min(100, Math.round(body.impliedProbability ?? 0))),
      "External Prediction Market",
      body.marketUrl,
      body.metadataHash,
    );
    const receipt = await tx.wait();

    const parsed = receipt?.logs
      ?.map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((event: any) => event?.name === "ExternalMarketImported");

    return NextResponse.json({
      marketId: parsed?.args?.marketId?.toString() ?? null,
      txHash: receipt?.hash ?? tx.hash,
      status: "imported",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not import external market to Arc testnet.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
