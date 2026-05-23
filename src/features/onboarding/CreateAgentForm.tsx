"use client";

import { useMemo, useRef, useState } from "react";
import { Bot, CheckCircle2, ChevronRight, Loader2, WalletCards } from "lucide-react";
import {
  saveAgentProfile,
  type AgentProfile,
} from "@/src/lib/agent-session";

const riskModes = ["Conservative", "Balanced", "Aggressive"] as const;
const focusOptions = [
  "Market Integrity",
  "Prediction Market Intelligence",
  "Social Trading Intelligence",
  "Cross Market Signals",
] as const;

type Props = {
  circleStatus: "configured" | "not-configured";
  nextPath?: string;
};

export function CreateAgentForm({ circleStatus, nextPath }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [riskMode, setRiskMode] = useState<string>("Balanced");
  const [focus, setFocus] = useState<string>("Market Integrity");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable random suffix — generated once per form mount, not on every keystroke
  const suffixRef = useRef(Math.random().toString(36).slice(2, 6));
  const agentId = useMemo(() => {
    if (!name.trim()) return "";
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `agora-${slug}-${suffixRef.current}`;
  }, [name]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Agent name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/agent/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, name: name.trim(), email: email.trim() || undefined, riskMode, focus }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "Agent creation failed");
      }

      // Save UI display data to localStorage (not the auth token — that's the cookie)
      const profile: AgentProfile = {
        agentId,
        name: name.trim(),
        email: email.trim() || undefined,
        riskMode,
        focus,
        createdAt: new Date().toISOString(),
        network: "arc-testnet",
        circleWallet: circleStatus === "configured" ? "configured" : "not-configured",
        sessionStatus: "active",
      };
      saveAgentProfile(profile);

      // Hard navigation ensures middleware sees the new cookie
      const destination = nextPath && nextPath !== "/create-agent" ? nextPath : "/radar";
      window.location.href = destination;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-400/30 text-violet-300">
          <Bot size={22} />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create Your AgoraLens Agent
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Your local testnet agent unlocks Radar, MarketCourt, Execution and Ledger.
          </p>
        </div>
      </div>

      {/* Form fields */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
        {/* Agent Name */}
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-zinc-200">Agent Name <span className="text-rose-400">*</span></span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aegis Market Auditor"
            required
            className="w-full rounded-xl border border-white/[0.08] bg-[#181820] px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30"
          />
        </label>

        {/* Email (optional) */}
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-zinc-200">
            Email <span className="text-zinc-600 text-xs font-normal">— optional</span>
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/[0.08] bg-[#181820] px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Risk Mode */}
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-zinc-200">Risk Mode</span>
            <select
              value={riskMode}
              onChange={(e) => setRiskMode(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#181820] px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30"
            >
              {riskModes.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>

          {/* Strategy Focus */}
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-zinc-200">Strategy Focus</span>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#181820] px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30"
            >
              {focusOptions.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Generated Agent Profile Preview */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Agent Profile Preview
        </p>
        <div className="mt-3 space-y-2">
          {[
            { label: "Agent ID", value: agentId || "Enter a name above" },
            { label: "Network", value: "Arc Testnet (Chain 5042002)" },
            { label: "Risk Mode", value: riskMode },
            { label: "Strategy", value: focus },
            { label: "Session", value: "Active on creation" },
            { label: "Receipt Registry", value: process.env.NEXT_PUBLIC_RECEIPT_REGISTRY_ADDRESS ? "Configured ✓" : "Pending deployment" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
              <span className="text-[11px] text-zinc-500">{row.label}</span>
              <span className="font-mono text-[11px] text-zinc-200 text-right max-w-[60%] truncate">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Circle Status Notice */}
      <div className={`rounded-2xl border p-4 text-sm leading-6 ${
        circleStatus === "configured"
          ? "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-200"
          : "border-violet-400/20 bg-violet-500/[0.05] text-zinc-300"
      }`}>
        {circleStatus === "configured" ? (
          <span className="flex items-center gap-2">
            <WalletCards size={15} className="shrink-0 text-emerald-400" />
            Circle Wallets are configured. Agent creation will use wallet-backed onboarding.
          </span>
        ) : (
          <span className="flex items-start gap-2">
            <WalletCards size={15} className="mt-0.5 shrink-0 text-violet-400" />
            <span>
              Circle Wallets are not configured yet. AgoraLens is using a{" "}
              <strong className="text-white">Local Agent Session</strong> for testnet development.
              Add <code className="rounded bg-white/[0.06] px-1 py-0.5 text-xs">CIRCLE_API_KEY</code> to enable wallet-backed onboarding.
            </span>
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-400">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 py-4 text-base font-bold text-white shadow-[0_10px_30px_rgba(124,58,237,0.4)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Creating Agent Session...
          </>
        ) : (
          <>
            <CheckCircle2 size={18} />
            Launch Agent &amp; Enter Dashboard
            <ChevronRight size={16} />
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-zinc-600">
        Testnet only · No real funds · No mainnet activity
      </p>
    </form>
  );
}
