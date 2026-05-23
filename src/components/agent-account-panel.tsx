"use client";

import { useState } from "react";
import { LogOut, Trash2, Loader2 } from "lucide-react";
import { getAgentProfile, logoutAgent, forgetAgent } from "@/src/lib/agent-session";

export function AgentAccountPanel() {
  const profile = getAgentProfile();
  const [showMenu, setShowMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!profile) {
    return null;
  }

  const agent = profile as NonNullable<typeof profile>;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/agent/logout", { method: "POST" });
      logoutAgent();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  function handleForgetAgent() {
    if (confirm(`Forget agent "${agent.name}"? You'll need the Agent ID to log back in.`)) {
      forgetAgent(agent.agentId);
      setShowMenu(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-right text-sm hover:bg-white/[0.05] transition"
      >
        <div className="text-right">
          <div className="text-xs font-semibold text-white truncate max-w-[120px]">{agent.name}</div>
          <div className="text-xs text-violet-300">Active</div>
        </div>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.08] bg-[#181820] shadow-lg z-50">
          {/* Agent Info */}
          <div className="border-b border-white/[0.05] px-4 py-3 space-y-2">
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-500">Agent ID</p>
              <p className="text-xs font-mono text-zinc-300 truncate">{agent.agentId}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-500">Status</p>
              <p className="text-xs text-emerald-400">✓ Active</p>
            </div>
            {agent.email && (
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-500">Email</p>
                <p className="text-xs text-zinc-300 truncate">{agent.email}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-1 p-2">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05] transition disabled:opacity-50"
            >
              {loggingOut ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut size={16} />
                  Logout
                </>
              )}
            </button>

            <button
              onClick={handleForgetAgent}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition"
            >
              <Trash2 size={16} />
              Forget Agent
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
