import { Gavel, ShieldAlert, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

export function MarketCourtView() {
  return (
    <section id="marketcourt" className="dashboard-panel">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr_1fr]">
        <AgentCard
          icon={<TrendingUp />}
          title="Bull Agent"
          subtitle="Optimistic validator"
          body="Awaiting a Radar market and configured signal payload. Bull Agent will validate source quality, price edge, and market clarity."
        />
        <div className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full bg-violet-500/15 text-violet-300">
              <Gavel />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">MarketCourt Audit Engine</h2>
              <p className="text-sm text-zinc-400">Backend route: /api/marketcourt/audit</p>
            </div>
          </div>
          <div className="mt-8 rounded-3xl bg-[#0b0b12] p-5 font-mono text-sm leading-7 text-zinc-300">
            <p className="text-violet-300">&gt; Waiting for marketId, signal payload, and agentId...</p>
            <p>&gt; Checks: question clarity, source credibility, deadline, liquidity, manipulation risk.</p>
            <p>&gt; Decisions: DEPLOY_TESTNET_ROUTE, WATCHLIST, REJECT.</p>
          </div>
          <div className="mt-8 rounded-3xl border border-amber-400/25 bg-amber-400/10 p-5">
            <p className="font-semibold text-amber-100">No audit has been run yet.</p>
            <p className="mt-2 text-sm leading-6 text-amber-100/80">
              Send an Arc testnet market from Radar after market and signal sources are configured.
            </p>
          </div>
        </div>
        <AgentCard
          icon={<ShieldAlert />}
          title="Bear Agent"
          subtitle="Risk skeptic"
          body="Awaiting configured market context. Bear Agent will flag ambiguity, manipulation risk, low liquidity, and resolution delays."
        />
      </div>
    </section>
  );
}

function AgentCard({ icon, title, subtitle, body }: { icon: ReactNode; title: string; subtitle: string; body: string }) {
  return (
    <article className="glass-card rounded-3xl p-6 md:p-8">
      <span className="grid size-12 place-items-center rounded-full bg-white/[0.06] text-violet-300">{icon}</span>
      <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-violet-300">{subtitle}</p>
      <p className="mt-6 text-sm leading-7 text-zinc-300">{body}</p>
    </article>
  );
}
