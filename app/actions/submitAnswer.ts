// app/actions/submitAnswer.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { analyzeAnswer } from "@/lib/ai";

export async function submitAnswer(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const interviewId = formData.get("interviewId") as string;
  const questionIndex = Number(formData.get("questionIndex"));
  const audio = formData.get("audio") as File | null;
  let transcript = (formData.get("transcript") as string) || "";

  if (!interviewId || Number.isNaN(questionIndex)) throw new Error("Bad payload");

  // ✅ If transcript is empty → mark as unanswered
  if (!transcript.trim()) {
    transcript = "";
  }

  // Validate ownership
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, userId },
    select: { questions: true },
  });
  if (!interview) throw new Error("Interview not found");

  const questions = (interview.questions as string[]) || [];
  const question = questions[questionIndex];
  if (!question) throw new Error("Invalid question index");

  // ✅ AI feedback (handles empty transcript too)
  const aiFeedback =
    transcript.trim().length === 0
      ? {
          accent: "N/A",
          fluency: "N/A",
          word_choice: "N/A",
          emotion: "N/A",
          strengths: [],
          improvements: ["No answer was provided for this question."],
          overall_score: 0,
        }
      : await analyzeAnswer(question, transcript);

  // Save
  const saved = await prisma.answer.create({
    data: {
      interviewId,
      questionIndex,
      question,
      transcript,
      aiFeedback,
    },
    select: {
      id: true,
      transcript: true,
      aiFeedback: true,
    },
  });

  return saved;
}
