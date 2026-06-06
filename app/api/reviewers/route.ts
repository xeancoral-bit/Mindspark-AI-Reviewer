import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../lib/session";
import prisma from "../../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        reviewers: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Listing reviewers failed:", error);
    return NextResponse.json(
      { error: "Failed to load reviewers." },
      { status: 500 }
    );
  }
}
