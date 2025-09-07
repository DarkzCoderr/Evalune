// lib/parseResumeToJson.ts
import pdfParse from "pdf-parse";

/**
 * Extracts plain text from a PDF buffer using pdf-parse.
 * @param buffer - Node.js Buffer containing PDF file data
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text.trim();
}

/**
 * Converts raw PDF text into a structured JSON format
 * @param rawText - Plain text extracted from PDF
 */
export async function toStructuredResumeJSON(rawText: string) {
  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    rawText,
    lines,
  };
}
