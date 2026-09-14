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

let knowledgeCache: { text: string; places: string[]; at: number } | null = null;

/**
 * How many attractions reach the prompt. It was 40, which silently hid a
 * sixth of the CMS — and the planner, asked for a farm day with most of the
 * farms cut, answered with one invented "Farm Hopping Loop" stop repeated
 * three times instead of naming three real farms. Generous enough that the
 * whole catalogue fits today, and a bound rather than a limit.
 */
const MAX_ATTRACTIONS = 120;

async function buildKnowledge(): Promise<{ text: string; places: string[] }> {
  if (knowledgeCache && Date.now() - knowledgeCache.at < 5 * 60 * 1000) {
    return { text: knowledgeCache.text, places: knowledgeCache.places };
  }

  const [attractions, itineraries, events, faqs] = await Promise.allSettled([
    getAllAttractions(),
    getItineraries(),
    getEvents(),
    getFaqs(),
  ]);

  const lines: string[] = ['=== LILIW, LAGUNA — LIVE DATABASE ===\n'];
  const places: string[] = [];

  if (attractions.status === 'fulfilled' && attractions.value.length) {
    lines.push('ATTRACTIONS & PLACES:');
    for (const a of attractions.value.slice(0, MAX_ATTRACTIONS)) {
      const attr = a.attributes;
      const type = a.type === 'heritage' ? 'Heritage Site'
        : a.type === 'dining' ? 'Dining/Food'
        : a.type === 'footwear' ? 'Footwear Store'
        : a.type === 'stay' ? 'Accommodations'
        : 'Tourist Spot';
      const name = String(attr.name ?? '').trim();
      if (!name) continue;
      places.push(name);
      lines.push(
        `- [${type}] ${name}` +
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
  knowledgeCache = { text, places, at: Date.now() };
  return { text, places };
}

/** Stripped to what a name match should care about: no case, no punctuation, no "(Merienda stop)" aside. */
function normalizePlace(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Words too common across the catalogue to identify anything on their own. */
const WEAK_WORDS = new Set(['liliw', 'laguna', 'the', 'and', 'for', 'stop', 'visit', 'tour', 'day', 'local']);

function significantWords(s: string): string[] {
  return normalizePlace(s).split(' ').filter((w) => w.length > 2 && !WEAK_WORDS.has(w));
}

/**
 * Rewrites every stop to a real attraction, and drops the ones that aren't.
 *
 * The prompt has always said not to invent places, and the model does it
 * anyway — "Local Bakeshop (Merienda stop)" for Liliw Bakeshop, or one "Farm
 * Hopping Loop" standing in for three separate farms. An invented stop can't
 * be linked, can't be mapped, and geocodes to the middle of town, so nothing
 * downstream can recover from it: it has to be resolved here or removed.
 *
 * Near-misses are matched back to the catalogue. Where a fuzzy match is
 * ambiguous the unused candidate wins, which is what turns three identical
 * "Farm Hopping Loop" stops into three different real farms; an exact name
 * repeats freely, since a multi-day trip is meant to return to one hotel.
 */
type PlanStop = { place?: unknown };
type PlanDay = { day?: number; stops?: PlanStop[] };

function groundStops(itinerary: { days?: PlanDay[] }, places: string[]): { kept: number; dropped: string[] } {
  const dropped: string[] = [];
  let kept = 0;
  if (!places.length) return { kept, dropped };

  const canonical = new Map(places.map((p) => [normalizePlace(p), p]));
  const used = new Set<string>();

  // How many attractions each word appears in. "Farm", "footwear" and
  // "restaurant" name a dozen businesses between them, so a stop sharing only
  // one of those has not named anything — matching on it would pick whichever
  // farm happened to sort first and present the guess as the plan.
  const wordFreq = new Map<string, number>();
  for (const place of places) {
    for (const word of new Set(significantWords(place))) {
      wordFreq.set(word, (wordFreq.get(word) ?? 0) + 1);
    }
  }
  const distinctive = (word: string) => (wordFreq.get(word) ?? 0) <= 2;

  const resolve = (raw: string): { name: string; exact: boolean } | null => {
    const name = normalizePlace(raw);
    if (!name) return null;

    const exact = canonical.get(name);
    if (exact) return { name: exact, exact: true };

    // One name inside the other ("Tsinelas Street" inside the Tsinelas
    // district), longest first so a short name can't claim a longer one.
    if (significantWords(raw).length >= 2) {
      const contained = [...canonical.entries()]
        .filter(([key]) => key.includes(name) || name.includes(key))
        .sort((a, b) => b[0].length - a[0].length);
      if (contained.length) return { name: contained[0][1], exact: true };
    }

    const words = new Set(significantWords(raw));
    if (!words.size) return null;
    let best: { name: string; score: number; fresh: boolean } | null = null;
    for (const place of places) {
      const placeWords = significantWords(place);
      if (!placeWords.length) continue;
      const shared = placeWords.filter((w) => words.has(w));
      if (!shared.some(distinctive)) continue;
      const score = shared.length / Math.min(placeWords.length, words.size);
      if (score < 0.5) continue;
      const fresh = !used.has(place);
      if (!best || (fresh && !best.fresh) || (fresh === best.fresh && score > best.score)) {
        best = { name: place, score, fresh };
      }
    }
    // A guessed match that lands on a place already in the plan is not worth
    // repeating a stop for: three "Farm Hopping Loop" stops naming one farm
    // three times reads worse than the two that couldn't be placed going away.
    if (!best || !best.fresh) return null;
    return { name: best.name, exact: false };
  };

  for (const day of itinerary.days ?? []) {
    day.stops = (day.stops ?? []).flatMap((stop) => {
      const raw = typeof stop?.place === 'string' ? stop.place : '';
      const match = resolve(raw);
      if (!match) {
        if (raw) dropped.push(raw);
        return [];
      }
      used.add(match.name);
      kept += 1;
      return [{ ...stop, place: match.name }];
    });
  }

  // A day left with nothing renders as an empty card, and the days after it
  // would keep numbers that no longer match their position.
  itinerary.days = (itinerary.days ?? [])
    .filter((d) => (d.stops?.length ?? 0) > 0)
    .map((d, i) => ({ ...d, day: i + 1 }));

  return { kept, dropped };
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

    const { text: knowledge, places } = await buildKnowledge();

    const allowedPlaces = places.length
      ? `\nALLOWED PLACE NAMES — the "place" field must be one of these, copied character for character:\n${places.map((p) => `• ${p}`).join('\n')}\n`
      : '';

    const systemPrompt = `You are an expert local travel planner for Liliw, Laguna, Philippines.
Your job is to create a personalized, realistic day-by-day itinerary using ONLY places from the database below.

${knowledge}
${allowedPlaces}
RULES:
- Every stop's "place" is copied verbatim from ALLOWED PLACE NAMES. Never invent
  a name, never describe a stop in that field ("Local Bakeshop (Merienda stop)"),
  and never collapse several places into one stop ("Farm Hopping Loop") — visiting
  three farms means three stops naming three different farms. The descriptive
  wording belongs in "activity" instead.
- Do not repeat a place, except an accommodation across the nights of one trip
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
          "place": "Exact name, copied from ALLOWED PLACE NAMES",
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

    const { kept, dropped } = groundStops(itinerary, places);
    if (dropped.length) {
      logger.warn('plan-trip: dropped stops that name no real attraction', { kept, dropped });
    }

    // A plan with no days is not a usable itinerary, whatever else is in it —
    // treating it as success sent the client a shape whose only real content
    // was missing, for it to fail on visibly instead of retrying invisibly
    // the way an outright request failure already does. A plan grounded down
    // to nothing counts the same: every stop it named was invented.
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
