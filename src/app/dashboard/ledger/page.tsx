import { getArcReceipts } from "@/src/lib/arc/receipt-registry";
import { LedgerView } from "@/src/features/ledger/LedgerView";

export default async function LedgerPage() {
  const receiptsState = await getArcReceipts();
  return <LedgerView receiptsState={receiptsState} />;
}
