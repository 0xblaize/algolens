/**
 * src/lib/ai/gemini.ts
 *
 * Server-side only. Never import this file in client components.
 * GEMINI_API_KEY is read from process.env — it is never sent to the frontend.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Shape Gemini must return for a MarketCourt audit. */
export type GeminiAuditResult = {
  bullArgument: string;
  bearArgument: string;
  judgeSummary: string;
  integrityScore: number;
  agentProbability: number;
  marketProbability: number;
  edgeBps: number;
  riskFlags: string[];
  decision: "DEPLOY_TESTNET_ROUTE" | "WATCHLIST" | "REJECT";
};

type GeminiCandidate = {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
};

type GeminiApiResponse = {
  candidates?: GeminiCandidate[];
  error?: { message?: string; code?: number };
};

type MarketInput = {
  marketId: string;
  question: string;
  category: string;
  resolutionSource: string;
  deadline: string;
  impliedProbability: number;
  liquidityHint: string;
};

type SignalInput = {
  id?: string;
  title?: string;
  summary?: string;
  confidence?: number;
  source?: string;
} | undefined;

/**
 * Runs a MarketCourt audit via the Gemini API.
 * Throws a descriptive error (no API key in message) if anything fails.
 * Never returns fake/fallback data — callers must handle thrown errors.
 */
export async function runGeminiAudit(
  market: MarketInput,
  signal: SignalInput,
): Promise<GeminiAuditResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  if (!apiKey) {
    throw new Error(
      "Gemini audit failed. Check API key or model config. (GEMINI_API_KEY is not set)",
    );
  }

  const signalBlock = signal
    ? `Signal title: ${signal.title ?? "n/a"}
Signal summary: ${signal.summary ?? "n/a"}
Signal confidence: ${signal.confidence ?? "n/a"}%
Signal source: ${signal.source ?? "n/a"}`
    : "No signal provided.";

  const deadlineDate = new Date(Number(market.deadline) * 1000).toISOString();
  const nowEpoch = Math.floor(Date.now() / 1000);
  const deadlinePast = Number(market.deadline) <= nowEpoch;

  const prompt = `You are MarketCourt, an AI market integrity system for AgoraLens running on Arc Testnet.

Analyse the following prediction market and attached signal, then produce a structured integrity audit.

## Market
- ID: ${market.marketId}
- Question: ${market.question}
- Category: ${market.category}
- Resolution source: ${market.resolutionSource || "not specified"}
- Deadline: ${deadlineDate}${deadlinePast ? " (PAST — deadline has already passed)" : ""}
- Implied probability: ${market.impliedProbability}%
- Liquidity hint: ${market.liquidityHint}

## Signal
${signalBlock}

## Your task
Produce a JSON audit with these exact fields. No markdown, no explanation — only the raw JSON object:

{
  "bullArgument": "A 2-3 sentence optimistic argument for why this market has integrity and the signal is directionally sound.",
  "bearArgument": "A 2-3 sentence sceptical argument highlighting risks, gaps, or red flags in the market or signal.",
  "judgeSummary": "A 2-3 sentence neutral synthesis that weighs both perspectives and explains the verdict.",
  "integrityScore": <integer 0-100, where 100 is perfect market integrity>,
  "agentProbability": <integer 0-100, the AI's assessed probability the market resolves YES>,
  "marketProbability": <integer 0-100, the implied probability from market data — use the value provided>,
  "edgeBps": <integer, calculated as (agentProbability - marketProbability) * 100>,
  "riskFlags": [<array of short risk flag strings, empty array if none>],
  "decision": "<exactly one of: DEPLOY_TESTNET_ROUTE | WATCHLIST | REJECT>"
}

Decision rules:
- DEPLOY_TESTNET_ROUTE if integrityScore >= 75 and no critical risk flags
- WATCHLIST if integrityScore 55-74 or minor flags exist
- REJECT if integrityScore < 55 or critical issues found

Respond with only the JSON object.`;

  const url = `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  let rawResponse: Response;
  try {
    rawResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.35,
          maxOutputTokens: 1024,
        },
      }),
    });
  } catch (networkErr) {
    throw new Error(
      `Gemini audit failed. Check API key or model config. (Network error: ${
        networkErr instanceof Error ? networkErr.message : "fetch failed"
      })`,
    );
  }

  const json = (await rawResponse.json()) as GeminiApiResponse;

  // Surface Gemini-level errors (bad key, quota, invalid model, etc.)
  if (!rawResponse.ok || json.error) {
    const msg = json.error?.message ?? `HTTP ${rawResponse.status}`;
    throw new Error(
      `Gemini audit failed. Check API key or model config. (${msg})`,
    );
  }

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(
      "Gemini audit failed. Check API key or model config. (Empty response from model)",
    );
  }

  // Strip any accidental markdown code fences
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: GeminiAuditResult;
  try {
    parsed = JSON.parse(cleaned) as GeminiAuditResult;
  } catch {
    throw new Error(
      `Gemini audit failed. Check API key or model config. (Model returned non-JSON: ${cleaned.slice(0, 120)})`,
    );
  }

  // Validate required fields are present and sane
  const required = [
    "bullArgument",
    "bearArgument",
    "judgeSummary",
    "integrityScore",
    "agentProbability",
    "marketProbability",
    "edgeBps",
    "riskFlags",
    "decision",
  ] as const;

  for (const key of required) {
    if (parsed[key] === undefined || parsed[key] === null) {
      throw new Error(
        `Gemini audit failed. Check API key or model config. (Missing field: ${key})`,
      );
    }
  }

  const validDecisions = ["DEPLOY_TESTNET_ROUTE", "WATCHLIST", "REJECT"];
  if (!validDecisions.includes(parsed.decision)) {
    throw new Error(
      `Gemini audit failed. Check API key or model config. (Invalid decision: ${parsed.decision})`,
    );
  }

  // Clamp numeric values to safe ranges
  parsed.integrityScore = Math.max(0, Math.min(100, Math.round(parsed.integrityScore)));
  parsed.agentProbability = Math.max(0, Math.min(100, Math.round(parsed.agentProbability)));
  parsed.marketProbability = Math.max(0, Math.min(100, Math.round(parsed.marketProbability)));
  parsed.edgeBps = Math.round(parsed.edgeBps);

  if (!Array.isArray(parsed.riskFlags)) {
    parsed.riskFlags = [];
  }

  return parsed;
}
