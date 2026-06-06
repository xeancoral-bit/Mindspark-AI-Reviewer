import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { extractText } from "@/lib/extractor";
import { processDocument } from "@/lib/document-processor";
import { generateAssessment, AssessmentType } from "@/lib/openai-reviewer";
import prisma from "@/lib/db";

// Background worker function to process documents and assessments
async function runBackgroundProcessor(documentId: string, userId: string, title: string, content: string) {
  try {
    // 1. Process document notes and summary
    const reviewerData = await processDocument(userId, title, content);
    
    // 2. Save Reviewer notes to database
    const reviewer = await prisma.reviewer.create({
      data: {
        documentId,
        userId,
        title,
        summary: reviewerData.summary,
        notesJson: JSON.stringify(reviewerData.notes),
      },
    });

    // 3. Generate assessments for the 7 study modes
    const assessmentTypes: AssessmentType[] = [
      "MULTIPLE_CHOICE",
      "TRUE_FALSE",
      "FILL_IN_THE_BLANK",
      "MATCHING",
      "FLASHCARD",
      "IDENTIFICATION",
      "TIMED"
    ];

    for (const type of assessmentTypes) {
      try {
        const questionsData = await generateAssessment(userId, reviewerData, type);
        await prisma.assessment.create({
          data: {
            reviewerId: reviewer.id,
            userId,
            type,
            title: `${type.replace(/_/g, " ")} Mode`,
            questions: JSON.stringify(questionsData),
          },
        });
      } catch (err) {
        console.error(`Failed to generate assessment type ${type} for document ${documentId}:`, err);
        // We will continue generating other assessments even if one fails
      }
    }

    // 4. Update Document status to COMPLETED
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "COMPLETED" },
    });

  } catch (error) {
    console.error(`Document processing failed for ID ${documentId}:`, error);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED" },
    }).catch(() => {});
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const fileType = file.name.split(".").pop()?.toLowerCase();
    if (!fileType || !["pdf", "docx", "pptx", "txt"].includes(fileType)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, PPTX, or TXT file." },
        { status: 400 }
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Check file size (limit to 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit." },
        { status: 400 }
      );
    }

    // Extract text from the uploaded file
    let extractedText = "";
    try {
      extractedText = await extractText(buffer, fileType);
    } catch (parseError: any) {
      return NextResponse.json(
        { error: parseError.message || "Failed to extract text from file." },
        { status: 422 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "No text content could be extracted from the file." },
        { status: 422 }
      );
    }

    // Save initial document record in processing state
    const document = await prisma.document.create({
      data: {
        userId: user.id,
        title: file.name.replace(/\.[^/.]+$/, ""), // Strip extension
        fileType,
        fileSize: buffer.length,
        content: extractedText,
        status: "PROCESSING"
      }
    });

    // Run processing in the background (detached promise)
    runBackgroundProcessor(document.id, user.id, document.title, extractedText);

    return NextResponse.json({
      success: true,
      documentId: document.id,
      title: document.title,
      status: document.status
    });

  } catch (error) {
    console.error("Upload handler failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during file upload." },
      { status: 500 }
    );
  }
}
