import { NextResponse } from "next/server";
import { getSafeArcStatus } from "@/src/lib/arc/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/arc/status
 *
 * Safe public configuration status only.
 * Does not return ARC_RPC_URL, ARC_PRIVATE_KEY_TESTNET, balances, or wallet keys.
 */
export async function GET() {
  const status = getSafeArcStatus();

  return NextResponse.json({
    marketRegistryConfigured: status.marketRegistryConfigured,
    receiptRegistryConfigured: status.receiptRegistryConfigured,
    rpcConfigured: status.rpcConfigured,
    privateKeyConfigured: status.privateKeyConfigured,
    chainId: status.chainId,
    explorerUrl: status.explorerUrl,
    currency: status.currency,
  });
}
