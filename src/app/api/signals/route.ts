import { NextResponse } from "next/server";
import { getPublicSignals } from "@/src/lib/signals";

/**
 * GET /api/signals
 *
 * Server-side only signal endpoint.
 * Provider chain: GDELT → Google News RSS → Cached → Error.
 * No API key required.
 * Never calls external providers from the client.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getPublicSignals();

  if (state.status === "error") {
    return NextResponse.json(
      { error: state.message, detail: state.detail },
      { status: 503 },
    );
  }

  if (state.status === "not-configured") {
    return NextResponse.json(
      { error: state.message, missing: state.missing },
      { status: 503 },
    );
  }

  return NextResponse.json({
    signals: state.signals,
    provider: state.provider,
    count: state.signals.length,
  });
}
