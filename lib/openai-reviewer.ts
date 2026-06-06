import { OpenAI } from "openai";
import { getOpenAIKey } from "./document-processor";

export type AssessmentType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_IN_THE_BLANK"
  | "MATCHING"
  | "FLASHCARD"
  | "IDENTIFICATION"
  | "TIMED";

/**
 * Generate assessment questions using OpenAI structured output
 */
export async function generateAssessment(
  userId: string,
  reviewerNotes: any,
  type: AssessmentType
): Promise<any> {
  const apiKey = await getOpenAIKey(userId);
  const openai = new OpenAI({ apiKey });

  const notesContext = typeof reviewerNotes === "string" 
    ? reviewerNotes 
    : JSON.stringify(reviewerNotes);

  let systemPrompt = "";
  const userPrompt = `Reviewer Title: ${reviewerNotes.title || "Study Material"}\n\nHere are the study notes to base the questions on:\n\n${notesContext}`;

  switch (type) {
    case "MULTIPLE_CHOICE":
      systemPrompt = `You are a professional educational assessor. Create 8 high-quality multiple choice questions based on the provided study notes.
Ensure questions test conceptual understanding, not just rote memorization.
Return a JSON object conforming exactly to this structure:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0, // Integer (0 to 3) representing the index of the correct option
      "explanation": "Brief explanation of why this option is correct."
    }
  ]
}`;
      break;

    case "TRUE_FALSE":
      systemPrompt = `You are a professional educational assessor. Create 8 high-quality True or False statements based on the provided study notes.
Mix true statements and false statements. Provide clear reasoning.
Return a JSON object conforming exactly to this structure:
{
  "questions": [
    {
      "statement": "The statement to evaluate.",
      "correctAnswer": true, // Boolean (true or false)
      "explanation": "Brief educational explanation of why this is true or false."
    }
  ]
}`;
      break;

    case "FILL_IN_THE_BLANK":
      systemPrompt = `You are a professional educational assessor. Create 6 high-quality fill-in-the-blank questions based on the provided study notes.
Each question should be a sentence or short paragraph where 1 or 2 important keywords are replaced by '[blank]'.
Return a JSON object conforming exactly to this structure:
{
  "questions": [
    {
      "text": "The primary [blank] of cells is mitochondria, which generates [blank].",
      "answers": ["powerhouse", "ATP"], // List of strings to fill the blanks, in correct order (case-insensitive checking will be used)
      "explanation": "Explanation of the concept and why these words fit."
    }
  ]
}`;
      break;

    case "MATCHING":
      systemPrompt = `You are a professional educational assessor. Create a matching type quiz based on the provided study notes.
Create 6 matching pairs of key terms and their definitions or descriptions.
Keep the description (right side) concise but distinct.
Return a JSON object conforming exactly to this structure:
{
  "pairs": [
    {
      "left": "Key Term or Concept",
      "right": "Matching definition, formula, or description"
    }
  ]
}`;
      break;

    case "FLASHCARD":
      systemPrompt = `You are a professional educational assessor. Create 12 flashcards based on the provided study notes.
The front side should present a term, question, or formula. The back side should have the short explanation or definition.
Return a JSON object conforming exactly to this structure:
{
  "flashcards": [
    {
      "front": "Term or Question",
      "back": "Short, clear answer or definition"
    }
  ]
}`;
      break;

    case "IDENTIFICATION":
      systemPrompt = `You are a professional educational assessor. Create 8 identification/short-answer questions based on the provided study notes.
Provide a clear prompt asking for a specific term, concept, or name. Provide the correct term and a few common acceptable variations (e.g. typos, acronyms).
Return a JSON object conforming exactly to this structure:
{
  "questions": [
    {
      "question": "What is the term for X?",
      "answer": "Primary Answer",
      "acceptedVariations": ["variation 1", "variation 2"], // Case-insensitive spelling variations or synonyms
      "explanation": "Educational context for this concept."
    }
  ]
}`;
      break;

    case "TIMED":
      systemPrompt = `You are a professional educational assessor. Create a timed rapid-fire quiz containing 10 multiple-choice questions of varying difficulty.
For each question, specify a timeLimit in seconds (e.g., 10 seconds for easy questions, 15-20 seconds for harder ones).
Return a JSON object conforming exactly to this structure:
{
  "questions": [
    {
      "question": "Rapid fire question text?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 2, // Integer index (0-3)
      "timeLimit": 15, // Suggested time limit in seconds (typically between 10 and 25)
      "explanation": "Quick explanation of the correct choice."
    }
  ]
}`;
      break;

    default:
      throw new Error(`Unsupported assessment type: ${type}`);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.5
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error(`Empty response from OpenAI during assessment generation for ${type}`);
  }

  return JSON.parse(content);
}
