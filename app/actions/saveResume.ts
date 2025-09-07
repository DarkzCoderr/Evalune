"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { extractTextFromPdf, toStructuredResumeJSON } from "@/lib/parseResumeToJson";

export async function saveResume(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file uploaded");
  if (file.type !== "application/pdf") throw new Error("Please upload a PDF.");

  // Convert uploaded File → Buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // PDF → text → structured JSON
  const rawText = await extractTextFromPdf(buffer);
  const parsedJson = await toStructuredResumeJSON(rawText);

  // Save resume record
  const resume = await prisma.resume.create({
    data: {
      userId,
      fileName: file.name,   // ✅ schema must have `fileName String`
      parsedJson,            // ✅ schema must have `parsedJson Json`
    },
    select: { id: true, parsedJson: true },
  });

  return { resumeId: resume.id, parsedJson: resume.parsedJson };
}
