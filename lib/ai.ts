// lib/ai.ts
import OpenAI from "openai";

/**
 * OpenRouter client (for free LLMs like Mistral, LLaMA, etc.)
 */
export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Virtual Interview",
  },
});

// -------------------------------
// Free LLM models (fallback order)
// -------------------------------
const FREE_MODELS = [
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3-8b-instruct:free",
  "mistralai/mixtral-8x7b-instruct:free",
];

/**
 * Run OpenRouter call with model fallback
 */
async function runWithFallback(messages: any[], temperature = 0.4): Promise<string> {
  for (const model of FREE_MODELS) {
    try {
      const r = await openrouter.chat.completions.create({
        model,
        messages,
        temperature,
      });
      return r.choices[0]?.message?.content?.trim() || "";
    } catch (err: any) {
      console.warn(`⚠️ ${model} failed:`, err.message || err);
      await new Promise((res) => setTimeout(res, 1200));
    }
  }
  return "";
}

/**
 * Generate 4–6 interview questions from parsed resume JSON
 */
export async function generateQuestionsFromResume(parsed: any): Promise<string[]> {
  const prompt = `
You are an interview coach. Generate 4-6 targeted interview questions based on this resume JSON.

Return ONLY a JSON array of strings.

Resume JSON:
${JSON.stringify(parsed, null, 2)}
`;

  const text = await runWithFallback(
    [
      { role: "system", content: "Return only valid JSON array of questions." },
      { role: "user", content: prompt },
    ],
    0.4
  );

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  let questions: string[] = [];
  try {
    questions = JSON.parse(cleaned);
  } catch {
    questions = [];
  }
  return Array.isArray(questions) ? questions.slice(0, 6) : [];
}

/**
 * Feedback on an individual audio answer transcript
 */
export async function analyzeAnswer(question: string, transcript: string) {
  const prompt = `
You are an interview evaluator. Analyze the candidate's spoken answer.

Return JSON with these fields:
{
  "accent": "brief note",
  "fluency": "brief note",
  "word_choice": "brief note",
  "emotion": "brief note of tone/energy",
  "clarity": "short note about clarity & structure",
  "conciseness": "short note about length and relevance",
  "confidence": "short note about confidence level",
  "relevance": "short note about relevance to the question",
  "examples": "note if examples/evidence were given",
  "strengths": ["list of key strengths"],
  "improvements": ["list of specific improvements"],
  "recommendation": "short closing recommendation",
  "overall_score": 1-10
}

If the transcript is empty or very short, return an overall_score of 0 and state that the user did not answer.
  
Question: "${question}"
Transcript:
"""
${transcript}
"""
Return only JSON.
`;

  const text = await runWithFallback(
    [
      { role: "system", content: "Return only valid JSON." },
      { role: "user", content: prompt },
    ],
    0.3
  );

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      accent: "N/A",
      fluency: "N/A",
      word_choice: "N/A",
      emotion: "N/A",
      clarity: "N/A",
      conciseness: "N/A",
      confidence: "N/A",
      relevance: "N/A",
      examples: "N/A",
      strengths: [],
      improvements: [],
      recommendation: "No valid response captured.",
      overall_score: 0,
    };
  }
}

/**
 * Overall feedback after all answers
 */
export async function analyzeInterview(transcripts: string[]) {
  const prompt = `
You are an experienced interview coach. Analyze the candidate's overall performance across ALL questions.

Return JSON with:
{
  "summary": "short overview of performance",
  "strengths": ["list of overall strengths"],
  "improvements": ["list of overall improvements"],
  "communication": "note about clarity, tone, and engagement",
  "consistency": "note about consistency across answers",
  "examples_usage": "note about how well they supported answers with examples",
  "final_recommendation": "short closing recommendation",
  "overall_score": 1-10
}

Here are the transcripts of all answers:
${JSON.stringify(transcripts, null, 2)}

Return only JSON.
`;

  const text = await runWithFallback(
    [
      { role: "system", content: "Return only JSON." },
      { role: "user", content: prompt },
    ],
    0.4
  );

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: "Could not analyze answers properly.",
      strengths: [],
      improvements: [],
      communication: "N/A",
      consistency: "N/A",
      examples_usage: "N/A",
      final_recommendation: "Try again with more complete responses.",
      overall_score: 0,
    };
  }
}
