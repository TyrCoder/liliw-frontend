import Groq from 'groq-sdk';

/**
 * Shared Groq client and model name for every AI feature (chat assistant and
 * trip planner).
 *
 * The model used to be hardcoded as 'llama-3.3-70b-versatile' in each route
 * separately. Groq rotates its hosted models and retires older ones; when
 * `llama-3.3-70b-versatile` stopped being accessible the API began returning
 * `model_not_found` (404) and every AI feature broke at once, in two places
 * that had to be found and edited independently.
 *
 * It now lives here, once, and reads GROQ_MODEL from the environment so the
 * next rotation is a Vercel env change + redeploy rather than a code edit.
 */
export const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

export const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

/**
 * Removes reasoning-model scaffolding from a completion's text.
 *
 * "Thinking" models (Qwen 3.x, DeepSeek-R1, etc., any of which GROQ_MODEL may
 * point at) can leak a <think>…</think> block into the message content. For the
 * chat that reasoning would be shown to the visitor; for the trip planner it
 * sits in front of the JSON and breaks JSON.parse. Stripping it keeps every
 * model interchangeable through GROQ_MODEL without special-casing.
 */
export function stripReasoning(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')   // closed reasoning block
    .replace(/^[\s\S]*?<\/think>/i, '')          // dangling block: keep only what follows </think>
    .trim();
}

/**
 * Pulls the JSON object out of a completion that may be wrapped in reasoning,
 * prose, or a markdown code fence. Returns a string ready for JSON.parse.
 */
export function extractJson(raw: string): string {
  let s = stripReasoning(raw);
  s = s.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  // If prose surrounds the object, take from the first { to the last }.
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last > first) s = s.slice(first, last + 1);
  return s.trim();
}
