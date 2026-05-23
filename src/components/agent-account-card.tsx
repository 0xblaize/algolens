"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, CircleDot, LogOut, Network, Shield, Wallet } from "lucide-react";
import { clearAgentProfile, getAgentProfile, type AgentProfile } from "@/src/lib/agent-session";

export function AgentAccountCard() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Read from localStorage only on client (avoids hydration mismatch)
  useEffect(() => {
    setProfile(getAgentProfile());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/agent/logout", { method: "POST" });
    } finally {
      clearAgentProfile();
      // Hard navigate to clear any cached state
      window.location.href = "/";
    }
  }

  // No profile in localStorage yet (first render or SSR) — show minimal indicator
  if (!profile) {
    return (
      <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
        <CircleDot size={16} className="text-violet-400" />
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] py-1.5 pl-1.5 pr-3 transition hover:bg-white/[0.08]"
        aria-label="Agent account menu"
      >
        <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[11px] font-bold text-white">
          {initials || "A"}
        </span>
        <span className="hidden max-w-[100px] truncate text-xs font-semibold text-zinc-200 sm:block">
          {profile.name}
        </span>
        <ChevronDown
          size={13}
          className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#18181f] shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          {/* Agent identity */}
          <div className="border-b border-white/[0.07] p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white">
                {initials || "A"}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{profile.name}</p>
                <p className="truncate font-mono text-[10px] text-zinc-500">
                  {profile.agentId}
                </p>
              </div>
            </div>
          </div>

          {/* Status rows */}
          <div className="divide-y divide-white/[0.05] p-2">
            {[
              {
                icon: CircleDot,
                label: "Session",
                value: "Active",
                valueCls: "text-emerald-400",
              },
              {
                icon: Network,
                label: "Network",
                value: "Arc Testnet",
                valueCls: "text-violet-300",
              },
              {
                icon: Wallet,
                label: "Circle Wallet",
                value: profile.circleWallet === "configured" ? "Connected" : "Not configured",
                valueCls:
                  profile.circleWallet === "configured" ? "text-emerald-400" : "text-amber-400",
              },
              {
                icon: Shield,
                label: "Risk Mode",
                value: profile.riskMode,
                valueCls: "text-zinc-300",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center gap-2 text-zinc-400">
                  <row.icon size={13} />
                  <span className="text-xs">{row.label}</span>
                </div>
                <span className={`text-[11px] font-bold ${row.valueCls}`}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Local session notice */}
          {profile.circleWallet === "not-configured" && (
            <div className="mx-2 mb-2 rounded-xl border border-violet-400/15 bg-violet-500/[0.05] px-3 py-2.5 text-[10px] leading-4 text-zinc-400">
              Local Agent Session · Circle Wallet not configured · Arc Testnet mode
            </div>
          )}

          {/* Logout */}
          <div className="border-t border-white/[0.07] p-2">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-rose-400 transition hover:bg-rose-500/[0.08] disabled:opacity-60"
            >
              <LogOut size={14} />
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
