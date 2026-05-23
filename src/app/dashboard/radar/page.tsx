import { getArcMarkets } from "@/src/lib/arc/market-registry";
import { getArcReceipts } from "@/src/lib/arc/receipt-registry";
import { getPublicSignals } from "@/src/lib/signals";
import { RadarView } from "@/src/features/radar/RadarView";

export default async function RadarPage() {
  const [marketsState, signalsState, receiptsState] = await Promise.all([
    getArcMarkets(),
    getPublicSignals(),
    getArcReceipts(),
  ]);
  const receiptCount =
    receiptsState.status === "configured" ? receiptsState.data.length : 0;

  return (
    <RadarView
      marketsState={marketsState}
      signalsState={signalsState}
      receiptCount={receiptCount}
    />
  );
}
