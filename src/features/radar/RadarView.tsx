"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart2,
  Globe,
  RadioTower,
  Search,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { ArcDataState, ArcMarket } from "@/src/lib/arc/types";
import type { SignalDataState } from "@/src/lib/signals/types";

// ── Static mock data (real integration coming soon) ──────────────────────────

const MOCK_SIGNALS = [
  {
    id: "1",
    bias: "Bullish",
    biasCls: "bg-violet-500/20 text-violet-300",
    timeAgo: "12m ago",
    title: "Inflation pressure rising in Eurozone",
    source: "Financial Times",
    confidence: 88,
    active: true,
    category: "Macro",
  },
  {
    id: "2",
    bias: "Bearish",
    biasCls: "bg-rose-500/20 text-rose-300",
    timeAgo: "24m ago",
    title: "OPEC+ considering unexpected production cuts",
    source: "Bloomberg Terminal",
    confidence: 72,
    active: false,
    category: "Macro",
  },
  {
    id: "3",
    bias: "Bullish",
    biasCls: "bg-violet-500/20 text-violet-300",
    timeAgo: "45m ago",
    title: "US Fed interest rate pivot signals",
    source: "Reuters Intelligence",
    confidence: 91,
    active: false,
    category: "Macro",
  },
  {
    id: "4",
    bias: "Bullish",
    biasCls: "bg-violet-500/20 text-violet-300",
    timeAgo: "1h ago",
    title: "Tech sector AI spending reaches new peak",
    source: "TechCrunch Elite",
    confidence: 64,
    active: false,
    category: "Technology",
  },
  {
    id: "5",
    bias: "Neutral",
    biasCls: "bg-zinc-600/40 text-zinc-300",
    timeAgo: "2h ago",
    title: "Political instability in South Asian trade routes",
    source: "Al Jazeera News",
    confidence: 55,
    active: false,
    category: "Macro",
  },
];

const FEATURED_MARKET = {
  question: "Will inflation exceed 34 percent by June 30, 2026?",
  tags: ["Polymarket", "Liquidity: High", "Resolution: June 2026"],
  impliedProb: "67%",
  marketVol: "$1.2M",
  analysis: [
    {
      icon: TrendingUp,
      title: "Strong Signal Match",
      body: "The signal from Financial Times directly corroborates this market outcome with 88% confidence.",
    },
    {
      icon: ShieldCheck,
      title: "Liquidity Threshold Met",
      body: "Orderbook depth is sufficient for positions up to 50k USDC with minimal slippage.",
    },
  ],
};

const STAT_CARDS = [
  { icon: Activity, label: "Global Pulse", value: "High", badge: "+12%", badgeCls: "text-emerald-400 bg-emerald-400/10" },
  { icon: RadioTower, label: "Active Signals", value: "482", badge: null, badgeCls: "" },
  { icon: ShieldCheck, label: "AI Reliability", value: "94.2%", badge: "Stable", badgeCls: "text-violet-300 bg-violet-400/10" },
  { icon: BarChart2, label: "Market Correlation", value: "0.78", badge: null, badgeCls: "" },
];

const FILTERS = ["All Signals", "Macro", "Technology", "Crypto"];

// ── Props (kept for future real-data wiring) ──────────────────────────────────

type RadarViewProps = {
  marketsState: ArcDataState<ArcMarket[]>;
  signalsState: SignalDataState;
  receiptCount: number;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function RadarView(_props: RadarViewProps) {
  const [activeFilter, setActiveFilter] = useState("All Signals");
  const [activeSignal, setActiveSignal] = useState(MOCK_SIGNALS[0].id);

  const filtered =
    activeFilter === "All Signals"
      ? MOCK_SIGNALS
      : MOCK_SIGNALS.filter((s) => s.category === activeFilter);

  return (
    <section id="radar" className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/25">
          <RadioTower size={22} />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Radar Discovery
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real-world signals → matched markets
          </p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <card.icon size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                {card.label}
              </p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <p className="text-xl font-bold text-white">{card.value}</p>
                {card.badge && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${card.badgeCls}`}>
                    {card.badge}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-400 sm:w-72">
          <Search size={15} className="shrink-0" />
          <span>Search signals, sources, or markets...</span>
        </div>
        <div className="flex items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activeFilter === f
                  ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main two-column grid ── */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ── Left: Live Signals Feed ── */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
              <TrendingUp size={13} className="text-violet-400" />
              Live Signals Feed
            </div>
            <span className="animate-pulse text-[10px] font-bold uppercase tracking-widest text-violet-400">
              ● Updating
            </span>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {filtered.map((signal) => {
              const isActive = activeSignal === signal.id;
              return (
                <button
                  key={signal.id}
                  onClick={() => setActiveSignal(signal.id)}
                  className={`w-full px-5 py-4 text-left transition ${
                    isActive ? "border-l-2 border-violet-400 bg-violet-500/[0.06]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${signal.biasCls}`}>
                        {signal.bias}
                      </span>
                      <span className="text-[11px] text-zinc-500">{signal.timeAgo}</span>
                    </div>
                    <span className="text-[11px] font-bold text-zinc-400">
                      CONFIDENCE{" "}
                      <span className={signal.confidence >= 80 ? "text-violet-300" : "text-zinc-300"}>
                        {signal.confidence}%
                      </span>
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold leading-snug text-white">
                    {signal.title}
                  </h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <Globe size={11} />
                    {signal.source}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: Intelligence Report ── */}
        <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          {/* Panel header */}
          <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            <Zap size={12} className="text-violet-400" />
            Intelligence Report
          </div>

          <div className="flex flex-1 flex-col p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Matched Market Opportunity
            </p>
            <h2 className="mt-2 text-lg font-bold leading-snug text-white">
              {FEATURED_MARKET.question}
            </h2>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {FEATURED_MARKET.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Implied Prob.</p>
                <p className="mt-1 text-2xl font-bold text-white">{FEATURED_MARKET.impliedProb}</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Market Vol.</p>
                <p className="mt-1 text-2xl font-bold text-white">{FEATURED_MARKET.marketVol}</p>
              </div>
            </div>

            {/* Analysis */}
            <div className="mt-4 space-y-3">
              {FEATURED_MARKET.analysis.map((item) => (
                <div key={item.title} className="flex gap-3 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-400">
                    <item.icon size={11} />
                  </span>
                  <div>
                    <span className="font-semibold text-white">{item.title}</span>{" "}
                    <span className="text-zinc-400">{item.body}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Status + CTA */}
            <div className="mt-auto pt-5">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Status</span>
                <span className="font-bold text-emerald-400">Ready for MarketCourt Audit</span>
              </div>
              <Link
                href="/marketcourt"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-500 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)] transition hover:scale-[1.01]"
              >
                Send to MarketCourt <ArrowRight size={15} />
              </Link>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <Search size={12} />
                <span>Looking for something else?</span>
                <span className="text-zinc-500">Request a custom market match from the AI Oracle.</span>
              </div>
              <button className="font-bold text-violet-400 hover:text-violet-300">Request</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
