import { NextResponse } from "next/server";
import { destroySession, SESSION_COOKIE_NAME } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    await destroySession(request);
    const response = NextResponse.json({ success: true, message: "Logged out successfully." });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (error: any) {
    console.error("POST /api/auth/logout error:", error);
    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}
