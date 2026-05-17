import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getAllAttractions, getFaqs, getItineraries, getEvents } from '@/lib/strapi';
import { checkRateLimit } from '@/lib/ratelimit';
import { logger } from '@/lib/logger';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

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
      const type = a.type === 'heritage' ? 'Heritage Site' : a.type === 'spot' ? 'Tourist Spot' : 'Dining/Food';
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

export async function POST(request: NextRequest) {
  if (!groq) return NextResponse.json({ error: 'Trip planner is temporarily unavailable.' }, { status: 503 });

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip, 3, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  try {
    const { duration, budget, interests, favoriteAttractions } = await request.json();

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
- Be specific with times (e.g., 8:00 AM, 10:30 AM, 2:00 PM)
- Include practical local tips (parking, best time to visit, what to order, etc.)
- Keep tone warm, friendly, and excited — like a knowledgeable local friend
- Spread stops realistically — don't overpack a half-day

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

    const userMessage = `Create a ${duration} itinerary for Liliw, Laguna.
Budget level: ${budget}
Interests: ${interests.join(', ')}${favoritesLine}
Return only the JSON object.`;

    const completion = await groq!.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const itinerary = JSON.parse(content);

    return NextResponse.json({ success: true, itinerary });
  } catch (err) {
    logger.error('plan-trip error:', err);
    return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 });
  }
}
