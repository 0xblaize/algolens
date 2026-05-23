import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/src/lib/agent-session";

/**
 * POST /api/agent/login
 * 
 * Restores an existing agent session.
 * 
 * Body:
 * - agentId: string (required)
 * 
 * TODO: Add Supabase lookup to verify agent exists in database
 * TODO: Add wallet-backed verification for additional security
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { agentId?: string };
    const { agentId } = body;

    if (!agentId || typeof agentId !== "string") {
      return Response.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // TODO: Verify agent exists in Supabase database
    // const { data: agent, error } = await supabase
    //   .from("agents")
    //   .select("id")
    //   .eq("id", agentId)
    //   .single();
    // if (error || !agent) {
    //   return Response.json({ error: "Agent not found" }, { status: 404 });
    // }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, agentId, {
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return Response.json(
      { success: true, message: "Agent session restored" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
