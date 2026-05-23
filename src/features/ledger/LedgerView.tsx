import { Clock, Database, LockKeyhole } from "lucide-react";
import type { ArcDataState, ReasoningReceipt } from "@/src/lib/arc/types";

export function LedgerView({ receiptsState }: { receiptsState: ArcDataState<ReasoningReceipt[]> }) {
  const receipts = receiptsState.status === "configured" ? receiptsState.data : [];

  return (
    <section id="ledger" className="dashboard-panel">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-white md:text-5xl">Immutable Ledger</h2>
          <p className="mt-3 text-zinc-300">Arc testnet reasoning receipts and lifecycle monitoring.</p>
        </div>
        <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-200">
          Receipt source: {receiptsState.status === "configured" ? receiptsState.source : "not configured"}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="glass-card rounded-3xl p-6 md:p-8">
          <LockKeyhole className="text-violet-300" size={34} />
          <h3 className="mt-6 text-xl font-semibold text-white">Receipt Registry Status</h3>
          {receiptsState.status === "configured" ? (
            <div className="mt-5 rounded-3xl border border-emerald-400/25 bg-emerald-400/10 p-5">
              <p className="font-semibold text-emerald-100">
                Loaded {receipts.length} Arc testnet receipt{receipts.length === 1 ? "" : "s"} from {receiptsState.source}.
              </p>
            </div>
          ) : (
            <StateBlock state={receiptsState} />
          )}
        </div>
        <div className="grid gap-4">
          {receipts.map((receipt) => (
            <article key={receipt.receiptId} className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-white">Receipt #{receipt.receiptId}</h3>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {receipt.lifecycleState}
                </span>
              </div>
              <dl className="mt-5 grid gap-3 text-sm">
                <Row label="Agent ID" value={receipt.agentId} />
                <Row label="Market ID" value={receipt.marketId} />
                <Row label="Reasoning hash" value={receipt.reasoningHash} />
                <Row label="Decision" value={receipt.decision} />
                <Row label="Suggested testnet USDC" value={receipt.suggestedUsdcAmount} />
              </dl>
            </article>
          ))}
          {receiptsState.status !== "configured" && (
            <div className="glass-card rounded-3xl p-6">
              <Database className="text-violet-300" />
              <StateBlock state={receiptsState} />
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 glass-card flex items-start gap-4 rounded-3xl p-6">
        <Clock className="mt-1 text-cyan-300" />
        <p className="text-sm leading-6 text-zinc-300">
          Active monitors will read watched markets from the database or contract once agent onboarding and receipt
          writes are configured.
        </p>
      </div>
    </section>
  );
}

function StateBlock({ state }: { state: { message: string; detail?: string; missing?: string[] } }) {
  return (
    <div className="mt-5 rounded-3xl border border-dashed border-violet-400/30 bg-violet-400/5 p-5">
      <p className="font-semibold text-white">{state.message}</p>
      {state.missing?.length ? <p className="mt-2 text-sm text-zinc-400">Missing: {state.missing.join(", ")}</p> : null}
      {state.detail ? <p className="mt-2 text-sm text-rose-200">{state.detail}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl bg-white/[0.04] px-4 py-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="max-w-[60%] truncate text-right font-mono text-zinc-100">{value}</dd>
    </div>
  );
}
