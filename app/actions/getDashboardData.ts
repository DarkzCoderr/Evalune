// app/actions/getDashboardData.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Server action that returns sanitized dashboard data for the current user.
 * Ensures startedAt is a string (ISO) and extracts/derives an overall score.
 */
export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const interviews = await prisma.interview.findMany({
    where: { userId },
    orderBy: { startedAt: "asc" },
    include: {
      // include answers so we can compute aggregated score if needed
      answers: true,
    },
  });

  const sanitized = interviews.map((it) => {
    // `it.feedback` is a Json field (could be null or an object)
    const fb = it.feedback as any | null;

    // Try to read overall_score from interview.feedback if present
    let overall_score: number | null = null;
    let strengths: string[] | null = null;
    let improvements: string[] | null = null;
    let summary: string | null = null;

    if (fb && typeof fb === "object") {
      if (typeof fb.overall_score === "number") overall_score = fb.overall_score;
      else if (typeof fb.overall_score === "string") {
        const parsed = parseFloat(fb.overall_score);
        overall_score = Number.isFinite(parsed) ? parsed : null;
      }
      strengths = Array.isArray(fb.strengths) ? fb.strengths : null;
      improvements = Array.isArray(fb.improvements) ? fb.improvements : null;
      summary = typeof fb.summary === "string" ? fb.summary : null;
    }

    // If we don't have overall_score in interview.feedback, try to derive it from per-answer aiFeedback
    if (overall_score === null) {
      const scoresFromAnswers = it.answers
        .map((a) => {
          try {
            const ai = a.aiFeedback as any;
            if (!ai) return null;
            if (typeof ai.overall_score === "number") return ai.overall_score;
            if (typeof ai.overall_score === "string") {
              const p = parseFloat(ai.overall_score);
              return Number.isFinite(p) ? p : null;
            }
            return null;
          } catch {
            return null;
          }
        })
        .filter((s): s is number => typeof s === "number");

      if (scoresFromAnswers.length > 0) {
        const avg =
          scoresFromAnswers.reduce((acc, v) => acc + v, 0) / scoresFromAnswers.length;
        overall_score = Math.round(avg * 10) / 10; // one decimal
      }
    }

    return {
      id: it.id,
      // convert Date -> ISO string (safe to send to client)
      startedAt: it.startedAt instanceof Date ? it.startedAt.toISOString() : String(it.startedAt),
      // store DB score if any (nullable)
      score: typeof it.score === "number" ? it.score : null,
      feedback: {
        summary,
        overall_score,
        strengths,
        improvements,
      },
    };
  });

  return { interviews: sanitized };
}
