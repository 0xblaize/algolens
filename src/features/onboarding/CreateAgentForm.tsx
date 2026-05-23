"use client";

import { useMemo, useState } from "react";
import { WalletCards } from "lucide-react";

const riskModes = ["Conservative", "Balanced", "Aggressive"];
const focusOptions = [
  "Market Integrity",
  "Prediction Market Intelligence",
  "Social Trading Intelligence",
  "Cross Market Signals",
];

type CreateAgentFormProps = {
  circleStatus: "configured" | "not-configured";
  circleMissing: string[];
};

export function CreateAgentForm({ circleStatus, circleMissing }: CreateAgentFormProps) {
  const [name, setName] = useState("");
  const [riskMode, setRiskMode] = useState("Balanced");
  const [focus, setFocus] = useState("Market Integrity");
  const agentId = useMemo(() => {
    if (!name.trim()) return "";
    return `agora-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  }, [name]);

  return (
    <div className="glass-card mx-auto max-w-3xl rounded-3xl p-6 md:p-10">
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-300">
          <WalletCards />
        </span>
        <div>
          <h1 className="text-3xl font-semibold text-white">Create AgoraLens Agent</h1>
          <p className="text-sm text-zinc-400">Circle Wallets onboarding is used when credentials are configured.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Agent name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-violet-400"
            placeholder="Aegis Market Auditor"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Risk mode</span>
          <select
            value={riskMode}
            onChange={(event) => setRiskMode(event.target.value)}
            className="rounded-2xl border border-white/10 bg-[#181820] px-4 py-3 text-white outline-none focus:border-violet-400"
          >
            {riskModes.map((mode) => (
              <option key={mode}>{mode}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Strategy focus</span>
          <select
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
            className="rounded-2xl border border-white/10 bg-[#181820] px-4 py-3 text-white outline-none focus:border-violet-400"
          >
            {focusOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={`mt-8 rounded-3xl border p-5 ${circleStatus === "configured" ? "border-emerald-400/25 bg-emerald-400/10" : "border-amber-400/25 bg-amber-400/10"}`}>
        <p className={`font-semibold ${circleStatus === "configured" ? "text-emerald-100" : "text-amber-100"}`}>
          Circle Wallets {circleStatus === "configured" ? "configured" : "not configured"}.
        </p>
        <p className={`mt-2 text-sm leading-6 ${circleStatus === "configured" ? "text-emerald-100/80" : "text-amber-100/80"}`}>
          {circleStatus === "configured"
            ? "Credentials are present. Connect the Circle Wallets API route next to create a real embedded wallet."
            : `Missing: ${circleMissing.join(", ")}. Until configured, this form only previews a local agent profile.`}
        </p>
      </div>

      <div className="mt-8 rounded-3xl bg-white/[0.04] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Local profile preview</p>
        <p className="mt-3 font-mono text-sm text-zinc-200">Agent ID: {agentId || "Enter agent name"}</p>
        <p className="mt-2 text-sm text-zinc-300">Risk: {riskMode}</p>
        <p className="mt-2 text-sm text-zinc-300">Focus: {focus}</p>
        <p className="mt-2 text-sm text-zinc-300">Wallet status: No wallet connected</p>
      </div>
    </div>
  );
}
