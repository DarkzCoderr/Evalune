// lib/ai.ts
import OpenAI from "openai";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

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
// Model routing config
// -------------------------------
const PRIMARY_MODEL = process.env.OPENROUTER_PRIMARY_MODEL || "openrouter/free";
const FALLBACK_MODELS = (process.env.OPENROUTER_FALLBACK_MODELS || "")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

/**
 * Run OpenRouter call with model fallback
 */
async function runWithFallback(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  temperature = 0.4
): Promise<string> {
  const errors: string[] = [];

  try {
    const requestPayload = {
      model: PRIMARY_MODEL,
      messages,
      temperature,
      extra_body: FALLBACK_MODELS.length ? { models: FALLBACK_MODELS } : undefined,
    } as unknown as Parameters<typeof openrouter.chat.completions.create>[0];

    const r = await openrouter.chat.completions.create(requestPayload);
    const content = r.choices[0]?.message?.content?.trim() || "";
    if (!content) {
      errors.push(`Primary model ${PRIMARY_MODEL} returned empty content`);
      throw new Error(`Model ${PRIMARY_MODEL} returned empty content`);
    }
    return content;
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    errors.push(`${PRIMARY_MODEL}: ${message}`);
    console.warn("[ai.runWithFallback] Model request failed", {
      model: PRIMARY_MODEL,
      fallbackModels: FALLBACK_MODELS,
      message,
    });
  }

  const aggregateError = new Error(
    `Model routing failed or returned empty output. Attempts: ${errors.join(" | ")}`
  );
  (aggregateError as Error & { details?: string[] }).details = errors;
  throw aggregateError;
}

/**
 * Generate 4–6 interview questions from parsed resume JSON
 */
export async function generateQuestionsFromResume(parsed: unknown): Promise<string[]> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  if (parsed == null || typeof parsed !== "object") {
    throw new Error("Invalid resume parsedJson: expected a non-null object");
  }

  const prompt = `
You are an interview coach. Generate 4-6 targeted interview questions based on this resume JSON.

Return ONLY a JSON array of strings.

Resume JSON:
${JSON.stringify(parsed, null, 2)}
`;

  let text = "";
  try {
    text = await runWithFallback(
      [
        { role: "system", content: "Return only valid JSON array of questions." },
        { role: "user", content: prompt },
      ],
      0.4
    );
  } catch (err: unknown) {
    console.error("[ai.generateQuestionsFromResume] AI call failed", {
      error: getErrorMessage(err),
      parsedPreview: JSON.stringify(parsed).slice(0, 500),
    });
    throw new Error(`Question generation AI call failed: ${getErrorMessage(err)}`);
  }

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  if (!cleaned) {
    console.error("[ai.generateQuestionsFromResume] Empty AI response after cleaning", {
      rawText: text,
    });
    throw new Error("Question generation returned empty content");
  }

  let questions: unknown;
  try {
    questions = JSON.parse(cleaned);
  } catch (err: unknown) {
    console.error("[ai.generateQuestionsFromResume] Failed to parse AI JSON", {
      error: getErrorMessage(err),
      cleanedPreview: cleaned.slice(0, 1000),
    });
    throw new Error("Question generation returned invalid JSON");
  }

  if (!Array.isArray(questions)) {
    console.error("[ai.generateQuestionsFromResume] AI output was not an array", {
      outputType: typeof questions,
      outputPreview: JSON.stringify(questions).slice(0, 1000),
    });
    throw new Error("Question generation did not return an array");
  }

  const normalized = questions
    .filter((q): q is string => typeof q === "string")
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (!normalized.length) {
    console.error("[ai.generateQuestionsFromResume] Parsed array contains no valid question strings", {
      outputPreview: JSON.stringify(questions).slice(0, 1000),
    });
    throw new Error("Question generation returned no usable questions");
  }

  return normalized;
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
export async function analyzeInterview(
  transcripts: Array<{ question: string; transcript: string }>
) {
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
