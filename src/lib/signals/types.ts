export type SignalSourceStatus = "configured" | "not-configured" | "error";

export type PublicSignal = {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  timestamp: string;
  confidence: number;
  category: string;
  summary: string;
};

export type SignalDataState =
  | { status: "configured"; signals: PublicSignal[]; source: string }
  | { status: "not-configured"; message: string; missing: string[] }
  | { status: "error"; message: string; detail?: string };
