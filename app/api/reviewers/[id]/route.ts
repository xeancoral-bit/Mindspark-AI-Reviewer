import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/session";
import prisma from "../../../../lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const reviewer = await prisma.reviewer.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        assessments: {
          include: {
            progress: {
              where: { userId: user.id },
              orderBy: { completedAt: "desc" },
              take: 1, // Only get the latest score
            },
          },
        },
      },
    });

    if (!reviewer) {
      return NextResponse.json({ error: "Reviewer not found." }, { status: 404 });
    }

    return NextResponse.json({ reviewer });
  } catch (error) {
    console.error("Retrieving reviewer details failed:", error);
    return NextResponse.json(
      { error: "Failed to load reviewer details." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if ID is a Reviewer ID
    const reviewer = await prisma.reviewer.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (reviewer) {
      // Delete the root document, which cascade deletes reviewer, assessments, and progress
      await prisma.document.delete({
        where: { id: reviewer.documentId },
      });
      return NextResponse.json({ success: true });
    }

    // If not found as Reviewer, check if it's a Document ID directly (for FAILED/PROCESSING states)
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (document) {
      await prisma.document.delete({
        where: { id: document.id },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Reviewer or Document not found." }, { status: 404 });
  } catch (error) {
    console.error("Deleting resource failed:", error);
    return NextResponse.json(
      { error: "Failed to delete reviewer resource." },
      { status: 500 }
    );
  }
}
