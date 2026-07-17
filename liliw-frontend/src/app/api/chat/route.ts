import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getAllAttractions, getFaqs, getItineraries, getEvents } from '@/lib/content';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Cache the knowledge base for 5 minutes
let knowledgeCache: { text: string; at: number; attractionMap: Map<string, any> } | null = null;

async function buildKnowledge(): Promise<{ text: string; attractionMap: Map<string, any> }> {
  if (knowledgeCache && Date.now() - knowledgeCache.at < 5 * 60 * 1000) {
    return { text: knowledgeCache.text, attractionMap: knowledgeCache.attractionMap };
  }

  const [attractions, faqs, itineraries, events] = await Promise.allSettled([
    getAllAttractions(),
    getFaqs(),
    getItineraries(),
    getEvents(),
  ]);

  const lines: string[] = ['=== LILIW REAL DATA (from live database) ===\n'];
  const attractionMap = new Map<string, any>();

  if (attractions.status === 'fulfilled' && attractions.value.length) {
    lines.push('ATTRACTIONS & PLACES (include the URL when recommending):');
    for (const a of attractions.value.slice(0, 30)) {
      const attr = a.attributes;
      const typeLabel = a.type === 'heritage' ? 'Heritage' : a.type === 'spot' ? 'Tourist Spot' : 'Dining';
      lines.push(`- [${typeLabel}] ${attr.name} | URL: /attractions/${a.id}${attr.location ? ` | ${attr.location}` : ''}${attr.description ? ` | ${attr.description.slice(0, 100)}` : ''}${attr.rating ? ` | Rating: ${attr.rating}/5` : ''}`);
      attractionMap.set(a.id, a);
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
  knowledgeCache = { text, at: Date.now(), attractionMap };
  return { text, attractionMap };
}

// Detect language from user message
function detectLanguage(text: string): 'tagalog' | 'english' | 'taglish' {
  const lower = text.toLowerCase();
  const words = lower.split(/[\s,!?.]+/).filter(Boolean);

  const tagalogWords = new Set([
    'ang', 'mga', 'ng', 'sa', 'na', 'ay', 'siya', 'niya', 'nila', 'ito', 'iyan', 'iyon',
    'yung', 'yun', 'talaga', 'naman', 'dito', 'doon', 'para', 'dahil', 'pero', 'hindi',
    'wala', 'may', 'meron', 'ko', 'mo', 'kayo', 'kami', 'tayo', 'po', 'opo', 'ano',
    'bakit', 'paano', 'kailan', 'sino', 'saan', 'maganda', 'gutom', 'kain', 'punta',
    'gusto', 'pwede', 'dapat', 'lang', 'din', 'rin', 'kasi', 'nang', 'ngayon', 'bukas',
    'huwag', 'alin', 'alam', 'anong', 'nasaan', 'mayroon', 'walang', 'kanila', 'namin',
    'saan', 'pumunta', 'magpunta', 'kakain', 'libre', 'bayad', 'daw', 'raw', 'ba', 'eh',
    'ha', 'uy', 'ay', 'grabe', 'ganda', 'sarap', 'astig', 'maganda', 'masarap',
  ]);

  const tagalogCount = words.filter(w => tagalogWords.has(w)).length;
  const ratio = tagalogCount / Math.max(words.length, 1);

  // Pure Tagalog: many Tagalog function words, short messages
  if (ratio >= 0.35) return 'tagalog';

  // Taglish: at least one Tagalog word mixed with English
  if (tagalogCount >= 1) return 'taglish';

  // Default: English
  return 'english';
}

function buildSystemPrompt(knowledge: string, language: 'tagalog' | 'english' | 'taglish'): string {
  const langInstruction = {
    tagalog: `⚠️ LANGUAGE LOCK — TAGALOG ONLY ⚠️
The user is writing in PURE TAGALOG. You MUST reply in PURE TAGALOG only.
DO NOT use any English words at all. Every single word in your reply must be Tagalog.
Example style: "Oo, maganda ang [lugar]! Malapit lang ito sa sentro ng Liliw. Subukan mo!"`,

    english: `⚠️ LANGUAGE LOCK — ENGLISH ONLY ⚠️
The user is writing in PURE ENGLISH. You MUST reply in PURE ENGLISH only.
DO NOT use any Tagalog or Filipino words at all. Every single word must be English.
Example style: "Yes, [place] is a must-visit! It's near the town center. Highly recommended!"`,

    taglish: `⚠️ LANGUAGE LOCK — TAGLISH ONLY ⚠️
The user is writing in TAGLISH (mixed Tagalog + English). You MUST reply in TAGLISH — naturally mix Tagalog and English the same way Filipinos text each other.
Example style: "Ay grabe, [place] is so worth it talaga! Malapit lang from the town proper. Try mo!"`,
  }[language];

  return `Ikaw si Lilio 🌺 — ang opisyal na AI tour guide ng Liliw, Laguna. Friendly, masaya, at laging handang tumulong.

${langInstruction}

RULES:
1. Answer ONLY about Liliw, Laguna — tourism, attractions, culture, food, events. Nothing else.
2. If asked something unrelated, reply: (in detected language) you only know about Liliw.
3. Keep answers SHORT — 2-3 sentences max, like a text message from a friend.
4. Use actual data from the database when answering.
5. Be natural and warm — not formal, like a local friend.
6. LINKS: When recommending a specific place, format as markdown: [Place Name](/attractions/id). Use the exact URL from the database.
7. Use emojis occasionally to keep it fun 🌿

${knowledge}`;
}

interface ChatRequest {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export async function POST(request: NextRequest) {
  if (!groq) {
    return NextResponse.json({ error: 'Chat is temporarily unavailable.', unavailable: true }, { status: 503 });
  }

  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    const { text: knowledge, attractionMap } = await buildKnowledge();
    const language = detectLanguage(message);
    const systemPrompt = buildSystemPrompt(knowledge, language);

    // Keep last 8 messages for context
    const recentHistory = history.slice(-8);

    // Hard language reminder injected just before the user message
    const langReminder = {
      tagalog:  'REMINDER: Sumagot ka sa PURONG TAGALOG lamang. Huwag gumamit ng kahit isang English na salita.',
      english:  'REMINDER: Reply in PURE ENGLISH only. Do not use any Tagalog or Filipino words.',
      taglish:  'REMINDER: Reply in TAGLISH — naturally mix Tagalog and English like a Filipino texting a friend.',
    }[language];

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'system', content: langReminder },
        { role: 'user', content: message },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.75,
      max_tokens: 250,
      top_p: 0.9,
    });

    const reply = completion.choices[0]?.message?.content
      || 'Ay, may problema sa connection ko. Ulit mo nga? 😅';

    // Extract attraction IDs mentioned in the reply via markdown links
    const linkRe = /\(\/attractions\/([^)]+)\)/g;
    const mentionedAttractions: any[] = [];
    const seen = new Set<string>();
    let lm: RegExpExecArray | null;
    while ((lm = linkRe.exec(reply)) !== null) {
      const id = lm[1];
      if (!seen.has(id) && attractionMap.has(id)) {
        seen.add(id);
        const a = attractionMap.get(id)!;
        const attr = a.attributes;
        const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
        const firstPhoto = attr.photos?.[0];
        const imgUrl = firstPhoto?.url
          ? (firstPhoto.url.startsWith('http') ? firstPhoto.url : `${STRAPI_BASE}${firstPhoto.url}`)
          : null;
        mentionedAttractions.push({
          id: a.id,
          name: attr.name,
          type: a.type,
          location: attr.location || null,
          rating: attr.rating || null,
          imageUrl: imgUrl,
          url: `/attractions/${a.id}`,
        });
      }
    }

    return NextResponse.json({ success: true, reply, attractions: mentionedAttractions });
  } catch {
    return NextResponse.json({ error: 'Failed to respond' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', guide: 'Lilio — Liliw Tour Guide' });
}
