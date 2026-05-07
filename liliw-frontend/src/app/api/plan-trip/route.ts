import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getAllAttractions } from '@/lib/strapi';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let knowledgeCache: { text: string; at: number } | null = null;

async function buildKnowledge(): Promise<string> {
  if (knowledgeCache && Date.now() - knowledgeCache.at < 5 * 60 * 1000) {
    return knowledgeCache.text;
  }
  const attractions = await getAllAttractions().catch(() => []);
  const lines: string[] = ['LILIW, LAGUNA — REAL ATTRACTIONS DATABASE:\n'];
  for (const a of attractions.slice(0, 40)) {
    const attr = a.attributes;
    const type = a.type === 'heritage' ? 'Heritage Site' : a.type === 'spot' ? 'Tourist Spot' : 'Dining/Food';
    lines.push(
      `- [${type}] ${attr.name}` +
      (attr.location ? ` | Location: ${attr.location}` : '') +
      (attr.description ? ` | About: ${String(attr.description).slice(0, 120)}` : '') +
      (attr.rating ? ` | Rating: ${attr.rating}/5` : '')
    );
  }
  const text = lines.join('\n');
  knowledgeCache = { text, at: Date.now() };
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const { duration, budget, interests } = await request.json();

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

    const userMessage = `Create a ${duration} itinerary for Liliw, Laguna.
Budget level: ${budget}
Interests: ${interests.join(', ')}
Return only the JSON object.`;

    const completion = await groq.chat.completions.create({
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
    console.error('plan-trip error:', err);
    return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 });
  }
}
