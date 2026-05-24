import { NextResponse } from "next/server";
import { getExternalMarkets } from "@/src/lib/markets";

/**
 * GET /api/markets/external
 *
 * Returns live external markets from Polymarket (read-only).
 * Server-side only — never calls Polymarket from client components.
 *
 * Read only. No trades. No orders. No fund movement.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedLimit = Number(searchParams.get("limit") ?? 30);
  const state = await getExternalMarkets(Number.isFinite(parsedLimit) ? parsedLimit : 30);

  if (state.status === "error") {
    return NextResponse.json(
      {
        error: "Live external market source is offline.",
        detail: state.detail ?? state.message,
      },
      { status: 503 },
    );
  }

  if (state.status === "not-configured") {
    return NextResponse.json(
      {
        error: "Live external market source is offline.",
        detail: state.message,
      },
      { status: 503 },
    );
  }

  if (state.status === "empty") {
    return NextResponse.json({ markets: [], source: state.source, count: 0 });
  }

  return NextResponse.json({
    markets: state.markets,
    source: state.source,
    count: state.markets.length,
  });
}
