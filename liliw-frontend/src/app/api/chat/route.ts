import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getAllAttractions, getFaqs, getItineraries, getEvents } from '@/lib/strapi';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Cache the knowledge base for 5 minutes
let knowledgeCache: { text: string; at: number } | null = null;

async function buildKnowledge(): Promise<string> {
  if (knowledgeCache && Date.now() - knowledgeCache.at < 5 * 60 * 1000) {
    return knowledgeCache.text;
  }

  const [attractions, faqs, itineraries, events] = await Promise.allSettled([
    getAllAttractions(),
    getFaqs(),
    getItineraries(),
    getEvents(),
  ]);

  const lines: string[] = ['=== LILIW REAL DATA (from live database) ===\n'];

  if (attractions.status === 'fulfilled' && attractions.value.length) {
    lines.push('ATTRACTIONS & PLACES:');
    for (const a of attractions.value.slice(0, 30)) {
      const attr = a.attributes;
      const typeLabel = a.type === 'heritage' ? 'Heritage' : a.type === 'spot' ? 'Tourist Spot' : 'Dining';
      lines.push(`- [${typeLabel}] ${attr.name}${attr.location ? ` (${attr.location})` : ''}${attr.description ? `: ${attr.description.slice(0, 120)}` : ''}${attr.rating ? ` ⭐${attr.rating}/5` : ''}`);
    }
    lines.push('');
  }

  if (itineraries.status === 'fulfilled' && itineraries.value.length) {
    lines.push('TOURS & ITINERARIES:');
    for (const it of itineraries.value.slice(0, 10)) {
      const a = (it as any).attributes || it;
      lines.push(`- ${a.name || a.title || 'Tour'}${a.duration ? ` (${a.duration})` : ''}${a.description ? `: ${String(a.description).slice(0, 100)}` : ''}`);
    }
    lines.push('');
  }

  if (events.status === 'fulfilled' && events.value.length) {
    lines.push('UPCOMING EVENTS:');
    for (const ev of events.value.slice(0, 8)) {
      const a = (ev as any).attributes || ev;
      lines.push(`- ${a.name || a.title || 'Event'}${a.date ? ` on ${a.date}` : ''}${a.description ? `: ${String(a.description).slice(0, 100)}` : ''}`);
    }
    lines.push('');
  }

  if (faqs.status === 'fulfilled' && faqs.value.length) {
    lines.push('FREQUENTLY ASKED QUESTIONS:');
    for (const faq of faqs.value.slice(0, 15)) {
      const a = (faq as any).attributes || faq;
      if (a.question && a.answer) {
        lines.push(`Q: ${a.question}\nA: ${String(a.answer).slice(0, 150)}`);
      }
    }
  }

  const text = lines.join('\n');
  knowledgeCache = { text, at: Date.now() };
  return text;
}

function buildSystemPrompt(knowledge: string): string {
  return `Ikaw si Lilio 🌺 — ang opisyal na tour guide ng Liliw, Laguna. Ikaw ay palakaibigan, masaya, at laging handang tumulong.

RULES:
1. Sumagot LAMANG tungkol sa Liliw, Laguna — tourism, attractions, kultura, pagkain, events. Wala kang alam sa ibang topics.
2. Kung tinanong ka ng hindi related sa Liliw, sabihin: "Ay, 'di ko po iyan area! Pero tanungin mo ako tungkol sa Liliw 😊"
3. LANGUAGE RULE — ito ang pinaka-importante:
   - Kung mag-Tagalog ang user → mag-Tagalog ka rin
   - Kung mag-English ang user → mag-English ka rin
   - Kung mag-Taglish (halong Tagalog + English) → mag-Taglish ka rin
   - Huwag mag-switch ng language maliban kung mag-switch muna ang user
4. Maging MAIKLI at SIMPLE — 2-3 sentences lang, tulad ng text message sa kaibigan
5. Gamitin ang actual data mula sa database para sumagot
6. Maging natural at relatable — hindi formal, parang kakilala

STYLE:
- Taglish-friendly: "Ay grabe, worth it talaga yung pupuntahan mo!"
- Maikli: hindi mahaba ang sagot, straight to the point
- Warm: parang kaibigan mo na local na taga-Liliw
- Gamitin ang emojis minsan para maging masaya 🌿

${knowledge}`;
}

interface ChatRequest {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    const knowledge = await buildKnowledge();
    const systemPrompt = buildSystemPrompt(knowledge);

    // Keep last 8 messages for context
    const recentHistory = history.slice(-8);

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: message },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.75,
      max_tokens: 250,
      top_p: 0.9,
    });

    const reply = completion.choices[0]?.message?.content
      || 'Ay, may problema sa connection ko. Ulit mo nga? 😅';

    return NextResponse.json({ success: true, reply });
  } catch {
    return NextResponse.json({ error: 'Failed to respond' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', guide: 'Lilio — Liliw Tour Guide' });
}
