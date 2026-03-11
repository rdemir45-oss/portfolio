import { NextRequest, NextResponse } from "next/server";

export function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  const secret = process.env.ADMIN_SECRET;
  return !!(secret && token && token === secret);
}

export const UNAUTHORIZED = NextResponse.json(
  { error: "Yetkisiz erişim." },
  { status: 401 }
);
