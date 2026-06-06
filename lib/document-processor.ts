import { OpenAI } from "openai";
import { decrypt } from "./crypto";
import prisma from "./db";

/**
 * Get the decrypted OpenAI API Key for a user or fall back to environment variable
 */
export async function getOpenAIKey(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { apiKey: true }
  });
  
  if (user?.apiKey) {
    const decrypted = decrypt(user.apiKey);
    if (decrypted) return decrypted;
  }
  
  const envKey = process.env.OPENAI_API_KEY;
  if (!envKey) {
    throw new Error("OpenAI API key is missing. Please configure it in your Settings page or environment.");
  }
  
  return envKey;
}

/**
 * Split text into chunks based on word counts with overlapping window
 */
export function chunkText(text: string, maxWordsPerChunk = 4000, overlapWords = 400): string[] {
  const words = text.split(/\s+/);
  if (words.length <= maxWordsPerChunk) {
    return [text];
  }
  
  const chunks: string[] = [];
  let index = 0;
  
  while (index < words.length) {
    const chunkWords = words.slice(index, index + maxWordsPerChunk);
    chunks.push(chunkWords.join(" "));
    index += (maxWordsPerChunk - overlapWords);
    
    // Safety check to prevent infinite loop
    if (index >= words.length || chunkWords.length === 0) break;
  }
  
  return chunks;
}

interface ReviewerSection {
  sectionTitle: string;
  bullets: string[];
  keyTerms: { term: string; definition: string }[];
}

interface ProcessedReviewer {
  title: string;
  summary: string;
  notes: ReviewerSection[];
}

/**
 * Use OpenAI to summarize a single text chunk
 */
async function summarizeChunk(openai: OpenAI, text: string, chunkIndex: number): Promise<ReviewerSection> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert educator. Analyze the provided study material chunk and generate study notes.
Return a JSON object conforming exactly to this structure:
{
  "sectionTitle": "A concise title representing the core topics in this section",
  "bullets": [
    "Key concept/fact summary 1",
    "Key concept/fact summary 2",
    "..."
  ],
  "keyTerms": [
    { "term": "Term Name", "definition": "Clear educational definition of this term" }
  ]
}`
      },
      {
        role: "user",
        content: `Here is the text chunk (Index: ${chunkIndex}):\n\n${text}`
      }
    ],
    temperature: 0.3
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI during chunk summarization");
  }

  return JSON.parse(content) as ReviewerSection;
}

/**
 * Generate a cohesive overall summary from chunk summaries (Reduce phase)
 */
async function generateOverallSummary(openai: OpenAI, title: string, sections: ReviewerSection[]): Promise<string> {
  const summaryInputs = sections.map(s => `Section: ${s.sectionTitle}\nBullet Points:\n${s.bullets.map(b => `- ${b}`).join("\n")}`).join("\n\n");
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert educator. Summarize the following section outlines into a cohesive, high-level educational overview. Focus on the main themes and learning objectives."
      },
      {
        role: "user",
        content: `Document Title: ${title}\n\nHere are the section summaries:\n\n${summaryInputs}`
      }
    ],
    temperature: 0.4
  });

  return response.choices[0]?.message?.content?.trim() || "No summary generated.";
}

/**
 * Process document content and create a full structured reviewer notes JSON
 */
export async function processDocument(userId: string, title: string, content: string): Promise<ProcessedReviewer> {
  const apiKey = await getOpenAIKey(userId);
  const openai = new OpenAI({ apiKey });
  
  const chunks = chunkText(content);
  const sections: ReviewerSection[] = [];
  
  // Process chunks in parallel or in small batches
  // Parallel execution for fast performance
  const promises = chunks.map((chunk, index) => summarizeChunk(openai, chunk, index));
  const results = await Promise.all(promises);
  sections.push(...results);

  // Generate overall summary
  const summary = await generateOverallSummary(openai, title, sections);

  return {
    title,
    summary,
    notes: sections
  };
}
