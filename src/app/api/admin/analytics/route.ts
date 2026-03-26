import { NextRequest, NextResponse } from "next/server";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { getActiveSessions } from "@/lib/active-sessions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const sessions = getActiveSessions();
  return NextResponse.json({ sessions, total: sessions.length });
}
