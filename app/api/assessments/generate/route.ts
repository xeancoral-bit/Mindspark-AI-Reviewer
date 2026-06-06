import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/session";
import { generateAssessment, AssessmentType } from "../../../../lib/openai-reviewer";
import prisma from "../../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewerId, type } = await req.json();

    if (!reviewerId || !type) {
      return NextResponse.json(
        { error: "Reviewer ID and assessment type are required." },
        { status: 400 }
      );
    }

    const reviewer = await prisma.reviewer.findFirst({
      where: { id: reviewerId, userId: user.id },
    });

    if (!reviewer) {
      return NextResponse.json({ error: "Reviewer not found." }, { status: 404 });
    }

    // Check if it already exists
    let assessment = await prisma.assessment.findFirst({
      where: { reviewerId, type },
    });

    if (assessment) {
      return NextResponse.json({ assessment });
    }

    // Generate notes representation for OpenAI
    const reviewerNotes = {
      title: reviewer.title,
      summary: reviewer.summary,
      notes: JSON.parse(reviewer.notesJson),
    };

    // Generate dynamically
    const questionsData = await generateAssessment(user.id, reviewerNotes, type as AssessmentType);

    assessment = await prisma.assessment.create({
      data: {
        reviewerId,
        userId: user.id,
        type,
        title: `${type.replace(/_/g, " ")} Mode`,
        questions: JSON.stringify(questionsData),
      },
    });

    return NextResponse.json({ assessment });
  } catch (error: any) {
    console.error("Generating assessment failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate assessment." },
      { status: 500 }
    );
  }
}
