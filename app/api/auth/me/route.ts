import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/session";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);

  if (!user) {
    return NextResponse.json(
      { user: null },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  return NextResponse.json(
    { user },
    {
      headers: {
        // Cache for 30s, then serve stale while revalidating in background
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    }
  );
}
