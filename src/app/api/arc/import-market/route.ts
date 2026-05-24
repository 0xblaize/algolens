import { NextResponse } from "next/server";
import { Contract, Wallet, getAddress, keccak256, toUtf8Bytes } from "ethers";
import { MARKET_REGISTRY_ABI } from "@/src/lib/arc/abis";
import { getArcConfig, getMissingArcMarketConfig } from "@/src/lib/arc/config";
import { getArcProvider } from "@/src/lib/arc/contracts";
import { classifyDeadline } from "@/src/lib/markets/deadline";

type ImportMarketRequest = {
  externalMarketId?: string;
  platform?: string;
  question?: string;
  category?: string;
  resolutionSource?: string;
  deadline?: string;
  marketUrl?: string;
  metadataHash?: string;
};

type ReceiptLog = {
  topics: readonly string[];
  data: string;
};

const ARC_TESTNET_CHAIN_ID = 5_042_002n;
const TX_WAIT_TIMEOUT_MS = 60_000;

export async function POST(request: Request) {
  let body: ImportMarketRequest;
  try {
    body = (await request.json()) as ImportMarketRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const missingFields = ["question", "category", "deadline", "marketUrl", "metadataHash"].filter(
    (field) => !body[field as keyof ImportMarketRequest],
  );
  if (missingFields.length) {
    return NextResponse.json(
      { error: `Missing audit target metadata: ${missingFields.join(", ")}` },
      { status: 400 },
    );
  }

  const deadline = validateDeadline(body.deadline);
  if (!deadline.ok) {
    return NextResponse.json(
      {
        error: deadline.detail,
        detail: deadline.detail,
      },
      { status: 400 },
    );
  }

  const missingConfig = getMissingArcMarketConfig();
  if (missingConfig.length || !process.env.ARC_PRIVATE_KEY_TESTNET) {
    return NextResponse.json(
      {
        error: "Arc testnet audit target creation is not configured.",
        missing: [
          ...missingConfig,
          ...(process.env.ARC_PRIVATE_KEY_TESTNET ? [] : ["ARC_PRIVATE_KEY_TESTNET"]),
        ],
      },
      { status: 400 },
    );
  }

  const { marketRegistryAddress } = getArcConfig();
  const provider = getArcProvider();
  if (!provider || !marketRegistryAddress) {
    return NextResponse.json(
      { error: "Arc testnet provider or MarketAuditRegistry address is unavailable." },
      { status: 400 },
    );
  }

  const registryAddress = getAddress(marketRegistryAddress);
  const network = await provider.getNetwork();
  if (network.chainId !== ARC_TESTNET_CHAIN_ID) {
    return NextResponse.json(
      {
        error: "Arc testnet import is connected to the wrong chain.",
        detail: `Expected chainId ${ARC_TESTNET_CHAIN_ID.toString()}, received ${network.chainId.toString()}.`,
      },
      { status: 400 },
    );
  }

  const code = await provider.getCode(registryAddress);
  if (!code || code === "0x") {
    return NextResponse.json(
      {
        error: "MarketAuditRegistry address has no deployed contract code.",
        detail: `No bytecode found at ${registryAddress} on Arc testnet.`,
      },
      { status: 400 },
    );
  }

  try {
    const signer = new Wallet(process.env.ARC_PRIVATE_KEY_TESTNET, provider);
    const balance = await provider.getBalance(signer.address);
    if (balance === 0n) {
      return NextResponse.json(
        { error: `Arc testnet wallet (${signer.address}) has insufficient funds for gas.` },
        { status: 402 },
      );
    }

    const contract = new Contract(registryAddress, MARKET_REGISTRY_ABI, signer);
    const sourceUrl = body.marketUrl as string;
    const sourceHash = keccak256(toUtf8Bytes(`${body.platform ?? "Polymarket"}:${body.externalMarketId ?? sourceUrl}`));
    const args = [
      body.question as string,
      body.category as string,
      sourceUrl,
      sourceHash,
      BigInt(deadline.value),
      body.metadataHash as string,
    ] as const;

    const calldata = contract.interface.encodeFunctionData("createAuditTarget", args);
    if (!calldata || calldata === "0x") {
      return NextResponse.json(
        {
          error: "Import route is not calling the MarketAuditRegistry function correctly.",
          detail: "Encoded calldata for createAuditTarget is empty.",
        },
        { status: 500 },
      );
    }

    try {
      await contract.createAuditTarget.staticCall(...args);
    } catch (error) {
      return NextResponse.json(
        {
          error: getStaticCallUserMessage(error),
          detail: getErrorMessage(error),
        },
        { status: 400 },
      );
    }

    const tx = await contract.createAuditTarget(...args, { gasLimit: 500_000 });
    if (!tx.data || tx.data === "0x") {
      return NextResponse.json(
        {
          error: "Import route is not calling the MarketAuditRegistry function correctly.",
          detail: "Transaction calldata is empty before submission.",
        },
        { status: 500 },
      );
    }

    const receipt = await Promise.race([
      tx.wait(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Transaction confirmation timed out after 60s")), TX_WAIT_TIMEOUT_MS),
      ),
    ]);

    const logs = (receipt as { logs?: ReceiptLog[] } | null)?.logs ?? [];
    const parsedEvent = logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((event) => event?.name === "AuditTargetCreated");

    const auditTargetId = parsedEvent?.args?.auditTargetId?.toString() ?? null;
    const txHash = (receipt as { hash?: string } | null)?.hash ?? tx.hash;

    return NextResponse.json({
      marketId: auditTargetId,
      auditTargetId,
      txHash,
      status: auditTargetId ? "created" : "submitted",
      mode: "testnet-audit-target-only",
      routeMode: deadline.classification.routeMode,
      auditLabel: deadline.classification.auditLabel,
      warnings: deadline.classification.warnings,
      calldataBytes: (tx.data.length - 2) / 2,
    });
  } catch (error) {
    const detail = getErrorMessage(error);
    const userMessage = /DEADLINE_IN_PAST/i.test(detail)
      ? "Market already expired."
      : /data=""|data: ""|data="0x"|data: "0x"/i.test(detail)
        ? "Import route is not calling the MarketAuditRegistry function correctly."
        : /insufficient funds|out of gas|gas required/i.test(detail)
          ? "Arc testnet wallet has insufficient funds for gas."
          : /network|fetch|ECONNREFUSED|timeout|could not detect/i.test(detail)
            ? "Could not connect to Arc testnet RPC. Check ARC_RPC_URL or try again."
            : /revert|execution reverted|CALL_EXCEPTION/i.test(detail)
              ? "Transaction reverted on Arc testnet. The audit registry rejected this target."
              : "Could not create audit target on Arc testnet.";

    return NextResponse.json({ error: userMessage, detail }, { status: 500 });
  }
}

function validateDeadline(value: string | undefined):
  | { ok: true; value: number; classification: ReturnType<typeof classifyDeadline> }
  | { ok: false; detail: string } {
  const deadline = Number(value);
  const classification = classifyDeadline(value);
  if (classification.kind === "invalid") {
    return { ok: false, detail: "Deadline is missing or invalid." };
  }
  if (!classification.importable) {
    return { ok: false, detail: classification.blockReason };
  }
  return { ok: true, value: deadline, classification };
}

function getStaticCallUserMessage(error: unknown): string {
  const detail = getErrorMessage(error);
  if (/DEADLINE_IN_PAST/i.test(detail)) {
    return "Market already expired.";
  }
  if (/TITLE_REQUIRED|SOURCE_URL_REQUIRED|SOURCE_HASH_REQUIRED|METADATA_HASH_REQUIRED/i.test(detail)) {
    return "Audit target metadata is incomplete and cannot be written to Arc testnet.";
  }
  if (/missing revert data|could not decode result data|function returned an unexpected amount of data/i.test(detail)) {
    return "MarketAuditRegistry ABI does not match deployed contract.";
  }
  return "MarketAuditRegistry rejected this audit target during preflight static call.";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
