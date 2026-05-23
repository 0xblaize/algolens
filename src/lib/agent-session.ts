// ── Constants ─────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "agoralens_agent_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const PROFILE_STORAGE_KEY = "agoralens_agent_profile";

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
};

// ── Client-side helpers (localStorage — UI display data only) ─────────────────

/** Save agent profile to localStorage for UI display. Not used for auth. */
export function saveAgentProfile(profile: AgentProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
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
