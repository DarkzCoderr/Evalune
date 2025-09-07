// app/actions/startInterview.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateQuestionsFromResume } from "@/lib/ai";

export async function startInterview(resumeId: string) {
  // Authenticate user
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Get the resume that belongs to this user
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    select: { id: true, parsedJson: true },
  });
  if (!resume) throw new Error("Resume not found");

  // Generate questions with AI
  const questions = await generateQuestionsFromResume(resume.parsedJson);
  if (!questions.length) throw new Error("Could not generate questions");

  // Create a new interview record
  const interview = await prisma.interview.create({
    data: {
      userId,
      resumeId: resume.id,
      questions, // Prisma will store as JSON
    },
    select: {
      id: true,
      questions: true,
    },
  });

  return {
    interviewId: interview.id,
    questions: interview.questions as string[],
  };
}
