import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/src/lib/agent-session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Delete the session cookie — this is the only auth we maintain
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
