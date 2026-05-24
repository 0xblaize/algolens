/**
 * src/lib/ai/gemini.ts
 *
 * Server-side only. Never import this file in client components.
 * GEMINI_API_KEY is read from process.env and is never sent to the frontend.
 */

import { classifyDeadline } from "@/src/lib/markets/deadline";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const VALID_DECISIONS = ["DEPLOY_TESTNET_ROUTE", "WATCHLIST", "REJECT"] as const;
const MALFORMED_JSON_ERROR = "Gemini returned malformed JSON. Try again.";

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
  decision: (typeof VALID_DECISIONS)[number];
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

type SignalInput =
  | {
      id?: string;
      title?: string;
      summary?: string;
      confidence?: number;
      source?: string;
    }
  | undefined;

/**
 * Runs a MarketCourt audit via the Gemini API.
 * Throws a descriptive error (no API key in message) if anything fails.
 * Never returns synthetic fallback data; callers must handle thrown errors.
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
  const deadlineRisk = classifyDeadline(market.deadline, nowEpoch);
  const deadlineWarnings = deadlineRisk.warnings.length
    ? deadlineRisk.warnings.join(", ")
    : "None";

  const prompt = `You are MarketCourt, an AI market integrity system for AgoraLens running on Arc Testnet.

Analyse the following prediction market and attached signal, then produce a structured integrity audit.

## Market
- ID: ${market.marketId}
- Question: ${market.question}
- Category: ${market.category}
- Resolution source: ${market.resolutionSource || "not specified"}
- Deadline: ${deadlineDate}${deadlinePast ? " (PAST - deadline has already passed)" : ""}
- Deadline audit mode: ${deadlineRisk.auditLabel}
- Deadline risk warnings: ${deadlineWarnings}
- Implied probability: ${market.impliedProbability}%
- Liquidity hint: ${market.liquidityHint}

## Signal
${signalBlock}

## Your task
Return ONLY valid JSON.
Do not include markdown.
Do not include backticks.
Do not include explanations outside JSON.
Do not include trailing commas.
Keep bullArgument, bearArgument, and judgeSummary under 700 characters each.
Keep riskFlags to short strings.

Required JSON shape:

{
  "bullArgument": "string",
  "bearArgument": "string",
  "judgeSummary": "string",
  "riskFlags": ["string"],
  "integrityScore": 0,
  "agentProbability": 0,
  "marketProbability": 0,
  "edgeBps": 0,
  "decision": "DEPLOY_TESTNET_ROUTE"
}

Allowed decision values:
- DEPLOY_TESTNET_ROUTE
- WATCHLIST
- REJECT

Decision rules:
- DEPLOY_TESTNET_ROUTE if integrityScore >= 75 and no critical risk flags
- WATCHLIST if integrityScore 55-74 or minor flags exist
- REJECT if integrityScore < 55 or critical issues found
- Bear Agent must include deadline risk when the deadline audit mode is Short Horizon Audit.
- Judge Agent should treat fast expiry as a risk factor for monitoring and evidence quality, not as automatic rejection.
- Everything is Arc Testnet only: write audit reasoning receipts only, do not recommend real orders, mainnet funds, live betting trades, or real capital deployment.

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
          responseSchema: {
            type: "OBJECT",
            properties: {
              bullArgument: { type: "STRING" },
              bearArgument: { type: "STRING" },
              judgeSummary: { type: "STRING" },
              riskFlags: { type: "ARRAY", items: { type: "STRING" } },
              integrityScore: { type: "INTEGER" },
              agentProbability: { type: "INTEGER" },
              marketProbability: { type: "INTEGER" },
              edgeBps: { type: "INTEGER" },
              decision: { type: "STRING", enum: VALID_DECISIONS },
            },
            required: [
              "bullArgument",
              "bearArgument",
              "judgeSummary",
              "riskFlags",
              "integrityScore",
              "agentProbability",
              "marketProbability",
              "edgeBps",
              "decision",
            ],
          },
          temperature: 0.2,
          maxOutputTokens: 2048,
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

  try {
    return parseGeminiAuditResult(text);
  } catch (parseError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Gemini audit] malformed JSON response", {
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
        responsePreview: text.slice(0, 500),
      });
    }
    throw new Error(MALFORMED_JSON_ERROR);
  }
}

function parseGeminiAuditResult(rawText: string): GeminiAuditResult {
  const parsed = parseJsonWithRecovery(rawText);
  const required = [
    "bullArgument",
    "bearArgument",
    "judgeSummary",
    "riskFlags",
    "integrityScore",
    "agentProbability",
    "marketProbability",
    "edgeBps",
    "decision",
  ] as const;

  for (const key of required) {
    if (!Object.hasOwn(parsed, key) || parsed[key] === undefined || parsed[key] === null) {
      throw new Error(MALFORMED_JSON_ERROR);
    }
  }

  if (!VALID_DECISIONS.includes(parsed.decision as (typeof VALID_DECISIONS)[number])) {
    throw new Error(MALFORMED_JSON_ERROR);
  }

  const integrityScore = parseScore(parsed.integrityScore);
  const agentProbability = parseScore(parsed.agentProbability);
  const marketProbability = parseScore(parsed.marketProbability);
  const edgeBps = Number(parsed.edgeBps);

  if (
    integrityScore === null ||
    agentProbability === null ||
    marketProbability === null ||
    !Number.isFinite(edgeBps)
  ) {
    throw new Error(MALFORMED_JSON_ERROR);
  }

  return {
    bullArgument: trimTextField(parsed.bullArgument, 700),
    bearArgument: trimTextField(parsed.bearArgument, 700),
    judgeSummary: trimTextField(parsed.judgeSummary, 700),
    riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags.map(String) : [],
    integrityScore,
    agentProbability,
    marketProbability,
    edgeBps: Math.round(edgeBps),
    decision: parsed.decision as (typeof VALID_DECISIONS)[number],
  };
}

function parseJsonWithRecovery(rawText: string): Record<string, unknown> {
  const direct = tryParseObject(rawText);
  if (direct) return direct;

  const withoutFences = removeMarkdownCodeFences(rawText);
  const unfenced = tryParseObject(withoutFences);
  if (unfenced) return unfenced;

  const extracted = extractFirstJsonObject(withoutFences);
  if (!extracted) throw new Error(MALFORMED_JSON_ERROR);

  const recovered = tryParseObject(extracted);
  if (!recovered) throw new Error(MALFORMED_JSON_ERROR);

  return recovered;
}

function tryParseObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value.trim()) as unknown;
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function removeMarkdownCodeFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractFirstJsonObject(value: string): string | null {
  const start = value.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < value.length; i += 1) {
    const char = value[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return value.slice(start, i + 1);
  }

  return null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseScore(value: unknown): number | null {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function trimTextField(value: unknown, maxLength: number): string {
  const text = String(value ?? "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}
