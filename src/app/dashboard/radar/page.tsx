import { getArcMarkets } from "@/src/lib/arc/market-registry";
import { getArcReceipts } from "@/src/lib/arc/receipt-registry";
import { getExternalMarkets } from "@/src/lib/markets";
import { getPublicSignals } from "@/src/lib/signals";
import { RadarView } from "@/src/features/radar/RadarView";

export const dynamic = "force-dynamic";

export default async function RadarPage() {
  const [arcMarketsState, externalMarketsState, signalsState, receiptsState] = await Promise.all([
    getArcMarkets(),
    getExternalMarkets(),
    getPublicSignals(),
    getArcReceipts(),
  ]);
  const receiptCount =
    receiptsState.status === "configured" ? receiptsState.data.length : 0;

  return (
    <RadarView
      arcMarketsState={arcMarketsState}
      externalMarketsState={externalMarketsState}
      signalsState={signalsState}
      receiptCount={receiptCount}
    />
  );
}
