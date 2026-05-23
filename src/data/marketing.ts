import {
  Activity,
  BadgeCheck,
  Bot,
  CircleDollarSign,
  FileWarning,
  Gavel,
  Gauge,
  Landmark,
  LockKeyhole,
  Radar,
  Route,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Siren,
  WalletCards,
  Zap,
} from "lucide-react";

export const navItems = [
  { label: "Radar", href: "/radar" },
  { label: "MarketCourt", href: "/marketcourt" },
  { label: "Execution", href: "/execution" },
  { label: "Ledger", href: "/ledger" },
];

export const trustBadges = [
  "AI Market Integrity",
  "MarketCourt Audit",
  "USDC Route Simulation",
  "Lifecycle Monitoring",
];

export const problemCards = [
  {
    title: "Badly written market rules",
    body: "Ambiguous phrasing makes outcomes disputable and weakens settlement confidence.",
    icon: FileWarning,
  },
  {
    title: "Unclear resolution sources",
    body: "Loose source definitions increase manipulation and late-stage settlement risk.",
    icon: ShieldAlert,
  },
  {
    title: "Low liquidity and manipulation risk",
    body: "Thin books invite price distortion before autonomous agents can react.",
    icon: Siren,
  },
  {
    title: "Agents that act without auditing",
    body: "Capital moves faster than the checks required for a fair market outcome.",
    icon: Bot,
  },
];

export const flowSteps = [
  {
    title: "Signal Scan",
    body: "Detect live-world events and match them with active prediction markets.",
    icon: Radar,
  },
  {
    title: "MarketCourt Audit",
    body: "Bull, Bear, and Judge agents test rules, sources, liquidity, and edge.",
    icon: Gavel,
  },
  {
    title: "USDC Route Simulation",
    body: "Preview gasless USDC movement through Arc before any real execution.",
    icon: Route,
  },
  {
    title: "Lifecycle Settlement Monitor",
    body: "Track entry, resolution checks, and final proof receipts until settlement.",
    icon: Activity,
  },
];

export const courtAgents = [
  {
    title: "Bull Agent validates the opportunity",
    body: "Confirms the signal-to-market match, checks directional edge, and estimates conviction.",
    accent: "text-emerald-300",
    icon: Gauge,
  },
  {
    title: "Bear Agent finds risk, ambiguity, manipulation, and liquidity concerns",
    body: "Challenges the thesis with adverse cases, source conflicts, and slippage pressure.",
    accent: "text-rose-300",
    icon: ShieldAlert,
  },
  {
    title: "Judge Agent gives integrity score and final verdict",
    body: "Synthesizes agent evidence into a capital-aware decision and audit trail.",
    accent: "text-cyan-300",
    icon: Scale,
  },
];

export const receiptRows = [
  ["Market hash", "0x9f82...ae2b9918c"],
  ["Reasoning hash", "0xc22a...f91a772c1"],
  ["Integrity score", "84 / 100"],
  ["Timestamp", "May 22, 2026 14:45 UTC"],
  ["Simulated Arc receipt status", "Demo verified"],
  ["USDC route simulation", "Arc gasless route preview"],
];

export const lifecycleSteps = [
  {
    title: "Entry",
    body: "Position sizing confirmed after MarketCourt approval.",
    icon: WalletCards,
  },
  {
    title: "Active Monitoring",
    body: "Price, source, and liquidity drift tracked in real time.",
    icon: Activity,
  },
  {
    title: "Resolution Check",
    body: "Oracle source and market wording compared before close.",
    icon: BadgeCheck,
  },
  {
    title: "Final Settlement Receipt",
    body: "Proof record generated for the completed lifecycle.",
    icon: LockKeyhole,
  },
];

export const dashboardStats = [
  { label: "Integrity Score", value: "84.2", hint: "MarketCourt consensus", icon: ShieldCheck },
  { label: "Edge", value: "+15%", hint: "Risk-adjusted signal", icon: Zap },
  { label: "USDC Route", value: "8.0", hint: "Simulated allocation", icon: CircleDollarSign },
  { label: "Active Monitor", value: "Live", hint: "Resolution tracking", icon: Activity },
];

export const dashboardTabs = [
  {
    id: "radar",
    title: "Radar",
    subtitle: "Real-world signals matched with live prediction markets.",
    icon: Radar,
    stats: ["482 active signals", "94.2% AI reliability", "0.78 market correlation"],
  },
  {
    id: "marketcourt",
    title: "MarketCourt",
    subtitle: "Bull, Bear, and Judge agents audit market quality before capital moves.",
    icon: Gavel,
    stats: ["84 integrity", "3-agent consensus", "Risk-adjusted verdict"],
  },
  {
    id: "execution",
    title: "Execution Engine",
    subtitle: "Simulated gasless USDC route sizing through Arc for demo-only deployment logic.",
    icon: Zap,
    stats: ["8.0 USDC simulated", "0.05% slippage", "Arc route preview"],
  },
  {
    id: "ledger",
    title: "Ledger",
    subtitle: "Immutable lifecycle trail from signal discovery through final settlement receipt.",
    icon: Landmark,
    stats: ["1,284 verified", "99.9% network trust", "Receipt pending"],
  },
];
