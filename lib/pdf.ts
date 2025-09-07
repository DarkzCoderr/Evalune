// lib/pdf.ts
import pdf from "pdf-parse";

/**
 * Extract text from PDF buffer
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text.trim();
}
