import { cookies } from "next/headers";
import { getArcMarkets } from "@/src/lib/arc/market-registry";
import { getArcReceipts } from "@/src/lib/arc/receipt-registry";
import { LedgerView } from "@/src/features/ledger/LedgerView";
import { SESSION_COOKIE } from "@/src/lib/agent-session";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  // Read the agent session cookie — this is the agentId set during agent creation.
  // HttpOnly cookie is readable server-side only, never by client JS.
  const cookieStore = await cookies();
  const agentId = cookieStore.get(SESSION_COOKIE)?.value ?? undefined;

  const [receiptsState, marketsState] = await Promise.all([
    getArcReceipts(agentId),
    getArcMarkets(),
  ]);

  return (
    <LedgerView
      receiptsState={receiptsState}
      marketsState={marketsState}
      explorerBase={process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app"}
    />
  );
}
