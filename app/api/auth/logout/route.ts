import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "../../../../lib/session";

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get("session")?.value;
  
  if (sessionToken) {
    await destroySession(sessionToken);
  }

  const response = NextResponse.json({ success: true });
  
  // Clear the cookie
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });

  return response;
}
