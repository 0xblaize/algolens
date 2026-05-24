import { getMissingArcReceiptConfig } from "./config";
import { getReceiptRegistryContract } from "./contracts";
import { fetchReceiptsFromSubgraph } from "./subgraph";
import type { ArcDataState, ReasoningReceipt, ReceiptLifecycleState } from "./types";

const LIFECYCLE_STATES: ReceiptLifecycleState[] = [
  "ENTRY",
  "MONITORING",
  "RESOLUTION_CHECK",
  "SETTLED",
  "REJECTED",
];

function normalizeReceipt(raw: Record<string, unknown>): ReasoningReceipt {
  return {
    receiptId: String(raw.receiptId ?? ""),
    agentId: String(raw.agentId ?? ""),
    marketId: String(raw.auditTargetId ?? raw.marketId ?? ""),
    signalHash: String(raw.signalHash ?? ""),
    reasoningHash: String(raw.reasoningHash ?? ""),
    integrityScore: Number(raw.integrityScore ?? 0),
    agentProbability: Number(raw.agentProbability ?? 0),
    marketProbability: Number(raw.referenceProbability ?? raw.marketProbability ?? 0),
    edgeBps: String(raw.edgeBps ?? "0"),
    suggestedUsdcAmount: String(raw.suggestedTestnetUsdcAmount ?? raw.suggestedUsdcAmount ?? "0"),
    decision: String(raw.decision ?? ""),
    lifecycleState: LIFECYCLE_STATES[Number(raw.lifecycleState ?? 0)] ?? "ENTRY",
    timestamp: String(raw.timestamp ?? ""),
    writer: String(raw.writer ?? ""),
    txHash: String(raw.txHash ?? ""),
    source: "rpc",
  };
}

async function getReceiptTransactionHashes(
  contract: NonNullable<ReturnType<typeof getReceiptRegistryContract>>,
  receiptIds: string[],
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    receiptIds.map(async (receiptId) => {
      try {
        const logs = await contract.queryFilter(
          contract.filters.ReceiptWritten(BigInt(receiptId), null, null),
          0,
          "latest",
        );
        const log = logs.at(-1);
        const txHash = log && "transactionHash" in log ? log.transactionHash : "";
        return txHash ? ([receiptId, txHash] as const) : null;
      } catch {
        return null;
      }
    }),
  );

  return new Map(entries.filter((entry): entry is readonly [string, string] => Boolean(entry)));
}

export async function getArcReceipts(agentId?: string): Promise<ArcDataState<ReasoningReceipt[]>> {
  try {
    const subgraphReceipts = await fetchReceiptsFromSubgraph(agentId);
    if (subgraphReceipts) {
      if (subgraphReceipts.length === 0) {
        return {
          status: "empty",
          source: "subgraph",
          message: "No Arc testnet receipts yet. Run MarketCourt and write a receipt.",
        };
      }
      return { status: "configured", data: subgraphReceipts, source: "subgraph" };
    }

    const missing = getMissingArcReceiptConfig();
    if (missing.length) {
      return {
        status: "not-configured",
        missing,
        message: "Arc Testnet receipt registry is pending configuration.",
      };
    }

    const contract = getReceiptRegistryContract();
    if (!contract || !agentId) {
      return {
        status: "not-configured",
        missing: !agentId ? ["agentId"] : missing,
        message: !agentId
          ? "Select or create an agent to read testnet receipts."
          : "Arc Testnet receipt registry is pending configuration.",
      };
    }

    const rawReceipts = (await contract.getReceiptsByAgent(agentId)) as Record<string, unknown>[];
    const receipts = rawReceipts.map(normalizeReceipt);
    const txHashes = await getReceiptTransactionHashes(
      contract,
      receipts.map((receipt) => receipt.receiptId).filter(Boolean),
    );
    for (const receipt of receipts) {
      receipt.txHash = txHashes.get(receipt.receiptId) ?? receipt.txHash;
    }
    if (receipts.length === 0) {
      return {
        status: "empty",
        source: "rpc",
        message: "No Arc testnet receipts yet. Run MarketCourt and write a receipt.",
      };
    }

    return { status: "configured", data: receipts, source: "rpc" };
  } catch (error) {
    return {
      status: "error",
      message: "Unable to load Arc testnet receipts.",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
