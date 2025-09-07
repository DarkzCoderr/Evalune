// app/actions/finalizeInterview.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { analyzeInterview } from "@/lib/ai";

/**
 * Finalize an interview by analyzing all answers together.
 */
export async function finalizeInterview(interviewId: string) {
  // ✅ Authenticate user
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // ✅ Fetch interview with answers
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    include: { answers: true },
  });

  if (!interview) throw new Error("Interview not found");
  if (!interview.answers || interview.answers.length === 0) {
    throw new Error("No answers found for this interview");
  }

  // ✅ Collect transcripts
  const transcripts = interview.answers.map((a) => ({
    question: a.question,
    transcript: a.transcript ?? "",
  }));

  // ✅ Analyze with AI
  const feedback = await analyzeInterview(transcripts);

  // ✅ Save back into Interview
  await prisma.interview.update({
    where: { id: interviewId },
    data: {
      feedback,
      score: feedback.overall_score ?? null,
      completedAt: new Date(),
    },
  });

  return feedback;
}
