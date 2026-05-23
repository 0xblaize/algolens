// ── Constants ─────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "agoralens_agent_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const PROFILE_STORAGE_KEY = "agoralens_agent_profile";
export const SAVED_AGENTS_KEY = "agoralens_saved_agents";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AgentProfile = {
  agentId: string;
  name: string;
  email?: string;
  riskMode: string;
  focus: string;
  createdAt: string;
  network: "arc-testnet";
  circleWallet: "not-configured" | "configured";
  sessionStatus: "active";
  walletAddress?: string;
};

export type SavedAgent = {
  agentId: string;
  name: string;
  createdAt: string;
  walletAddress?: string;
};

// ── Client-side helpers (localStorage — UI display data only) ─────────────────

/** Save agent profile to localStorage for UI display. Not used for auth. */
export function saveAgentProfile(profile: AgentProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  // Also add to saved agents list for quick login
  addToSavedAgents({
    agentId: profile.agentId,
    name: profile.name,
    createdAt: profile.createdAt,
    walletAddress: profile.walletAddress,
  });
}

/** Read agent profile from localStorage. Returns null on server or if missing. */
export function getAgentProfile(): AgentProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AgentProfile) : null;
  } catch {
    return null;
  }
}

/** Remove agent profile from localStorage (called on logout). */
export function clearAgentProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_STORAGE_KEY);
}

// ── Saved agents list (for quick login) ────────────────────────────────────────

/** Get all saved agents from localStorage. */
export function getSavedAgents(): SavedAgent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_AGENTS_KEY);
    return raw ? (JSON.parse(raw) as SavedAgent[]) : [];
  } catch {
    return [];
  }
}

/** Add an agent to the saved list (or update if it exists). */
function addToSavedAgents(agent: SavedAgent): void {
  if (typeof window === "undefined") return;
  const existing = getSavedAgents();
  const filtered = existing.filter((a) => a.agentId !== agent.agentId);
  const updated = [agent, ...filtered].slice(0, 10); // Keep last 10
  localStorage.setItem(SAVED_AGENTS_KEY, JSON.stringify(updated));
}

/** Find an agent by ID in saved agents. */
export function findAgentById(agentId: string): SavedAgent | null {
  const agents = getSavedAgents();
  return agents.find((a) => a.agentId === agentId) ?? null;
}

/** Remove an agent from saved list (forget agent). */
export function forgetAgent(agentId: string): void {
  if (typeof window === "undefined") return;
  const existing = getSavedAgents();
  const updated = existing.filter((a) => a.agentId !== agentId);
  localStorage.setItem(SAVED_AGENTS_KEY, JSON.stringify(updated));
}

/** Restore agent session from saved agents and set profile for UI. */
export function restoreAgentSession(agent: SavedAgent): AgentProfile {
  // Create a minimal profile for restored agents
  const profile: AgentProfile = {
    agentId: agent.agentId,
    name: agent.name,
    createdAt: agent.createdAt,
    riskMode: "Balanced",
    focus: "Market Integrity",
    network: "arc-testnet",
    circleWallet: "not-configured",
    sessionStatus: "active",
    walletAddress: agent.walletAddress,
  };
  saveAgentProfile(profile);
  return profile;
}

// ── Logout ────────────────────────────────────────────────────────────────────

/** Logout current agent (keep saved agent list unless explicitly forgotten). */
export function logoutAgent(): void {
  if (typeof window === "undefined") return;
  clearAgentProfile();
  // Session cookie is cleared by the server via logout API
}

// ── ID generation ─────────────────────────────────────────────────────────────

export function generateAgentId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `agora-${slug}-${suffix}`;
}
