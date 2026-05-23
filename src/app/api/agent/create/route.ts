import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/src/lib/agent-session";

type CreateAgentBody = {
  agentId?: string;
  name?: string;
  email?: string;
  riskMode?: string;
  focus?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateAgentBody;

  if (!body.agentId || !body.name) {
    return NextResponse.json(
      { error: "agentId and name are required" },
      { status: 400 },
    );
  }

  const response = NextResponse.json({
    success: true,
    agentId: body.agentId,
    name: body.name,
    network: "arc-testnet",
    circleWallet: "not-configured",
    sessionStatus: "active",
  });

  // Set HttpOnly cookie — this is the actual auth token
  // HttpOnly = JS cannot read it, only the server/middleware can
  response.cookies.set(SESSION_COOKIE, body.agentId, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
