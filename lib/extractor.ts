import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import JSZip from "jszip";

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Extract text from PDF buffer
 */
export async function extractPDF(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text || "";
  } catch (error) {
    console.error("PDF Extraction failed:", error);
    throw new Error("Failed to parse PDF document.");
  }
}

/**
 * Extract text from DOCX buffer
 */
export async function extractDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("DOCX Extraction failed:", error);
    throw new Error("Failed to parse DOCX document.");
  }
}

/**
 * Extract text from PPTX buffer
 */
export async function extractPPTX(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    
    // Get slide files
    const slideFiles = Object.keys(zip.files).filter((path) =>
      path.startsWith("ppt/slides/slide") && path.endsWith(".xml")
    );
    
    // Sort slide files numerically
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, "") || "0", 10);
      const numB = parseInt(b.replace(/[^0-9]/g, "") || "0", 10);
      return numA - numB;
    });

    let text = "";

    for (const slideFile of slideFiles) {
      const slideIndex = slideFile.replace(/[^0-9]/g, "");
      const xml = await zip.files[slideFile].async("text");
      const matches = xml.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/g);
      
      let slideText = "";
      for (const match of matches) {
        slideText += decodeXmlEntities(match[1]) + " ";
      }

      // Check if there are corresponding notes for this slide
      // Notes slides are mapped inside ppt/notesSlides/notesSlide*.xml
      // Note: notesSlide indices may not correspond 1:1, but ppt/notesSlides/_rels/notesSlide*.xml.rels has relationships.
      // A simple fallback is to search if a notesSlide matching slideIndex exists (e.g. ppt/notesSlides/notesSlide[Index].xml)
      const notesPath = `ppt/notesSlides/notesSlide${slideIndex}.xml`;
      let notesText = "";
      if (zip.files[notesPath]) {
        const notesXml = await zip.files[notesPath].async("text");
        const notesMatches = notesXml.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/g);
        for (const match of notesMatches) {
          notesText += decodeXmlEntities(match[1]) + " ";
        }
      }

      const slideNum = slideFiles.indexOf(slideFile) + 1;
      let slideContent = `--- Slide ${slideNum} ---\n`;
      if (slideText.trim()) {
        slideContent += `${slideText.trim()}\n`;
      }
      if (notesText.trim()) {
        slideContent += `[Speaker Notes]: ${notesText.trim()}\n`;
      }
      
      if (slideText.trim() || notesText.trim()) {
        text += slideContent + "\n";
      }
    }
    
    return text;
  } catch (error) {
    console.error("PPTX Extraction failed:", error);
    throw new Error("Failed to parse PPTX document.");
  }
}

/**
 * Extract text from TXT buffer
 */
export async function extractTXT(buffer: Buffer): Promise<string> {
  return buffer.toString("utf8");
}

/**
 * General router to extract text based on file type
 */
export async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  const normalizedType = fileType.toLowerCase().replace(/^\./, "");
  switch (normalizedType) {
    case "txt":
      return extractTXT(buffer);
    case "pdf":
      return extractPDF(buffer);
    case "docx":
      return extractDOCX(buffer);
    case "pptx":
      return extractPPTX(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
