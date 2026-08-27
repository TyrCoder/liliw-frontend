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
