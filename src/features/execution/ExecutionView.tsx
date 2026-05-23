import { Route, ShieldCheck, WalletCards, Zap } from "lucide-react";
import type { ReactNode } from "react";

export function ExecutionView() {
  return (
    <section id="execution" className="dashboard-panel">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Execution Engine</h2>
            <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              Testnet mode
            </span>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Metric icon={<Zap />} label="Edge" value="Awaiting audit" />
            <Metric icon={<WalletCards />} label="Suggested USDC" value="Not sized" />
            <Metric icon={<ShieldCheck />} label="Risk score" value="Pending" />
            <Metric icon={<Route />} label="Route status" value="Not prepared" />
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6 md:p-8">
          <h3 className="text-xl font-semibold text-white">Arc Testnet USDC Route</h3>
          <p className="mt-4 text-sm leading-7 text-zinc-300">
            Execution remains testnet-only. No mainnet funds, real orders, or live market execution are performed.
            Once MarketCourt returns a valid audit, this module can prepare a testnet USDC route and write an Arc
            testnet reasoning receipt.
          </p>
          <div className="mt-6 rounded-3xl border border-amber-400/25 bg-amber-400/10 p-5 text-sm text-amber-100">
            Configure Circle Wallets, Arc RPC, receipt registry, and testnet USDC balance to enable receipt writing.
          </div>
          <button className="btn-primary mt-6 w-full justify-center opacity-60" disabled>
            Write Arc Testnet Receipt
          </button>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <span className="text-violet-300">{icon}</span>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
