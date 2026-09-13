import { NextRequest, NextResponse } from 'next/server';
import { getAllAttractions, getFaqs, getItineraries, getEvents } from '@/lib/content';
import { checkRateLimit } from '@/lib/ratelimit';
import { logger } from '@/lib/logger';
import { groq, GROQ_MODEL, REASONING_EFFORT, extractJson } from '@/lib/groq';

/**
 * Creates a completion with REASONING_EFFORT applied (see src/lib/groq.ts),
 * falling back to the same call without it if GROQ_MODEL rejects the param.
 *
 * This route used to call groq.chat.completions.create() with no effort
 * hint at all, unlike the chat route — so a reasoning model ran at its
 * default (unset) effort here instead of 'low', taking noticeably longer
 * per generation. Combined with a cold serverless instance, that was enough
 * to occasionally clear Vercel's function timeout on the very first request
 * of a session and fail with a generic error, while a retry moments later
 * — warm instance, same model — came back in time. Matching the chat
 * route's effort setting removes that extra latency here too.
 */
async function createCompletion(params: Record<string, unknown>) {
  const withEffort = REASONING_EFFORT ? { ...params, reasoning_effort: REASONING_EFFORT } : params;
  try {
    return await groq!.chat.completions.create(withEffort as any);
  } catch (err) {
    const status = (err as { status?: number })?.status;
    const message = String((err as { message?: string })?.message ?? '');
    if (status === 400 && /reasoning_effort/i.test(message)) {
      return groq!.chat.completions.create(params as any);
    }
    throw err;
  }
}

let knowledgeCache: { text: string; at: number } | null = null;

async function buildKnowledge(): Promise<string> {
  if (knowledgeCache && Date.now() - knowledgeCache.at < 5 * 60 * 1000) {
    return knowledgeCache.text;
  }

  const [attractions, itineraries, events, faqs] = await Promise.allSettled([
    getAllAttractions(),
    getItineraries(),
    getEvents(),
    getFaqs(),
  ]);

  const lines: string[] = ['=== LILIW, LAGUNA — LIVE DATABASE ===\n'];

  if (attractions.status === 'fulfilled' && attractions.value.length) {
    lines.push('ATTRACTIONS & PLACES:');
    for (const a of attractions.value.slice(0, 40)) {
      const attr = a.attributes;
      const type = a.type === 'heritage' ? 'Heritage Site'
        : a.type === 'dining' ? 'Dining/Food'
        : a.type === 'footwear' ? 'Footwear Store'
        : a.type === 'stay' ? 'Accommodations'
        : 'Tourist Spot';
      lines.push(
        `- [${type}] ${attr.name}` +
        (attr.location ? ` | ${attr.location}` : '') +
        (attr.description ? ` | ${String(attr.description).slice(0, 120)}` : '') +
        (attr.rating ? ` | Rating: ${attr.rating}/5` : '')
      );
    }
    lines.push('');
  }

  if (itineraries.status === 'fulfilled' && itineraries.value.length) {
    lines.push('EXISTING TOUR PACKAGES:');
    for (const it of itineraries.value.slice(0, 10)) {
      const a = (it as any).attributes || it;
      lines.push(
        `- ${a.title || a.name || 'Tour'}` +
        (a.duration ? ` (${a.duration})` : '') +
        (a.difficulty ? ` | ${a.difficulty}` : '') +
        (a.price ? ` | ₱${a.price}/person` : '') +
        (a.description ? ` | ${String(a.description).slice(0, 100)}` : '')
      );
    }
    lines.push('');
  }

  if (events.status === 'fulfilled' && events.value.length) {
    lines.push('UPCOMING EVENTS:');
    for (const ev of events.value.slice(0, 8)) {
      const a = (ev as any).attributes || ev;
      lines.push(
        `- ${a.name || a.title || 'Event'}` +
        (a.date ? ` on ${a.date}` : '') +
        (a.description ? ` | ${String(a.description).slice(0, 100)}` : '')
      );
    }
    lines.push('');
  }

  if (faqs.status === 'fulfilled' && faqs.value.length) {
    lines.push('LOCAL TIPS & FAQs:');
    for (const faq of faqs.value.slice(0, 15)) {
      const a = (faq as any).attributes || faq;
      if (a.question && a.answer) {
        lines.push(`Q: ${a.question} → ${String(a.answer).slice(0, 150)}`);
      }
    }
    lines.push('');
  }

  const text = lines.join('\n');
  knowledgeCache = { text, at: Date.now() };
  return text;
}

/**
 * Repairs the two fields models most often mangle before the UI renders them.
 *
 * A weaker model (seen with Qwen) can flatten the tips array into one string
 * with its own `","` separators still inside, and spill the estimatedCostPerDay
 * key/value in as extra "tips" — which is why the Travel Tips list showed raw
 * JSON fragments like `estimatedCostPerDay`, `:`, `₱2`, `200`. This pulls the
 * real tips back out and recovers the cost, so imperfect output still renders
 * cleanly whatever GROQ_MODEL points at.
 */
function sanitizeItinerary(it: any): any {
  if (!it || typeof it !== 'object') return it;

  let tips: string[] = Array.isArray(it.tips)
    ? it.tips.map((t: any) => String(t))
    : typeof it.tips === 'string' ? [it.tips] : [];

  // Undo an array that was flattened into quote-comma-joined strings.
  tips = tips.flatMap(s => s.split('","'));

  // Everything from a leaked estimatedCostPerDay key onward is not a tip.
  const leak = tips.findIndex(s => /estimatedcostperday/i.test(s));
  let recoveredCost = '';
  if (leak !== -1) {
    recoveredCost = tips.slice(leak).join(' ')
      .replace(/estimatedcostperday/i, '')
      .replace(/["'\]:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    tips = tips.slice(0, leak);
  }

  it.tips = tips
    .map(s => s.replace(/^[\s"'[\]]+|[\s"'[\]]+$/g, '').trim())
    .filter(s => s.length > 1 && s !== ':');

  if (typeof it.estimatedCostPerDay !== 'string' || !it.estimatedCostPerDay.trim()) {
    if (recoveredCost) it.estimatedCostPerDay = recoveredCost;
  }

  // A day missing its own `stops` array, or `days` missing entirely, used to
  // reach the client as-is and crash the result view the moment it rendered
  // — several places there (the proximity sort, the map effect, the
  // duplicate-favorite check) call .map()/.flatMap() straight off
  // itinerary.days with no guard, on the assumption this route never sends
  // a shape without it. Normalizing here, once, is what actually keeps that
  // assumption true instead of just hoping the model cooperates.
  it.days = (Array.isArray(it.days) ? it.days : [])
    .filter((d: any) => d && typeof d === 'object')
    .map((d: any) => ({ ...d, stops: Array.isArray(d.stops) ? d.stops : [] }));

  return it;
}

export async function POST(request: NextRequest) {
  if (!groq) return NextResponse.json({ error: 'Trip planner is temporarily unavailable.' }, { status: 503 });

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(`plan-trip:${ip}`, 3, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  try {
    const { duration, groupSize, budget, interests, favoriteAttractions } = await request.json();

    if (!duration || !budget || !Array.isArray(interests) || interests.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const knowledge = await buildKnowledge();

    const systemPrompt = `You are an expert local travel planner for Liliw, Laguna, Philippines.
Your job is to create a personalized, realistic day-by-day itinerary using ONLY places from the database below.

${knowledge}

RULES:
- Only recommend places that appear in the database above — do NOT invent places
- Match the budget level and selected interests closely
- Suit the group size: pick venues that can accommodate the party, and tailor activities
  (e.g. kid-friendly stops for families, intimate spots for couples, group-friendly dining for large parties)
- Be specific with times (e.g., 8:00 AM, 10:30 AM, 2:00 PM)
- Include practical local tips (parking, best time to visit, what to order, etc.)
- Keep tone warm, friendly, and excited — like a knowledgeable local friend
- Spread stops realistically — don't overpack a half-day
- Accommodation ([Accommodation] places): ONLY include a place to stay when the
  trip spans more than one day. For a half-day, full-day, or any single-day
  trip the visitor goes home the same day — do NOT add a place to stay. For a
  multi-day trip, end each day except the last with a check-in / overnight at
  one accommodation and keep it consistent across the days.

IMPORTANT: Return ONLY a valid JSON object. No markdown, no extra text. Use this exact schema:
{
  "title": "Catchy trip title",
  "summary": "1-2 sentence trip overview",
  "days": [
    {
      "day": 1,
      "theme": "Theme for this day",
      "stops": [
        {
          "time": "8:00 AM",
          "place": "Exact place name from database",
          "activity": "What to do here",
          "duration": "~1 hour",
          "tip": "Local insider tip"
        }
      ]
    }
  ],
  "tips": ["Practical tip 1", "Practical tip 2", "Practical tip 3"],
  "estimatedCostPerDay": "₱XXX – ₱XXX"
}`;

    const favoritesLine = Array.isArray(favoriteAttractions) && favoriteAttractions.length > 0
      ? `\nMust-visit favorites (user specifically requested these): ${favoriteAttractions.join(', ')}`
      : '';

    const groupSizeLine = typeof groupSize === 'string' && groupSize.trim()
      ? `\nGroup size: ${groupSize.trim()}`
      : '';

    const userMessage = `Create a ${duration} itinerary for Liliw, Laguna.
Budget level: ${budget}${groupSizeLine}
Interests: ${interests.join(', ')}${favoritesLine}
Return only the JSON object.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage },
    ];

    let completion;
    try {
      // Strict JSON mode — best for models that support it (e.g. gpt-oss).
      completion = await createCompletion({
        messages, model: GROQ_MODEL, temperature: 0.7, max_tokens: 2000,
        response_format: { type: 'json_object' },
      });
    } catch (err) {
      // Reasoning models (e.g. Qwen) can't satisfy Groq's json_object
      // validation: their <think> preamble makes the raw output invalid JSON,
      // so Groq rejects it 400 json_validate_failed before returning anything.
      // Retry without the constraint — with more room for the reasoning tokens —
      // and pull the JSON out of the reply ourselves.
      const msg = err instanceof Error ? err.message : String(err);
      if (!/json_validate_failed|response_format|json_object/i.test(msg)) throw err;
      completion = await createCompletion({
        messages, model: GROQ_MODEL, temperature: 0.7, max_tokens: 6000,
      });
    }

    const content = completion.choices[0]?.message?.content || '{}';
    // Reasoning models can wrap the JSON in <think> blocks or a code fence,
    // which broke a bare JSON.parse — extractJson unwraps it first.
    const itinerary = sanitizeItinerary(JSON.parse(extractJson(content)));

    // A plan with no days is not a usable itinerary, whatever else is in it —
    // treating it as success sent the client a shape whose only real content
    // was missing, for it to fail on visibly instead of retrying invisibly
    // the way an outright request failure already does.
    if (!Array.isArray(itinerary?.days) || itinerary.days.length === 0) {
      logger.error('plan-trip error: model returned no days', { content: content.slice(0, 500) });
      return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 });
    }

    return NextResponse.json({ success: true, itinerary });
  } catch (err) {
    logger.error('plan-trip error:', err);
    return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 });
  }
}
