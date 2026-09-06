import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAttractions, getFaqs, getEvents, getNews, getItineraries,
} from '@/lib/content';
import { stripHtml } from '@/lib/text';

/**
 * Site search, answered from the database rather than a third party.
 *
 * Search was wired to Algolia alone, and Algolia was never configured in
 * production: with no app id the client fails on every query and the caller's
 * catch returns an empty list, so the search box has been answering "no
 * results" for everything since it was built. Nothing in the interface said
 * so — an unconfigured search and a genuine miss look identical.
 *
 * This searches the approved content directly. It needs no keys, no index to
 * rebuild, and nothing to keep in step: publishing something makes it findable
 * as soon as the content cache turns over. Algolia stays the first choice where
 * it is configured — see lib/algolia.ts — and this is what answers otherwise.
 */

interface Hit {
  objectID: string;
  name: string;
  description: string;
  type: 'heritage' | 'spot' | 'dining' | 'faq' | 'event' | 'news' | 'itinerary';
  category?: string;
  location?: string;
  rating?: number;
  url?: string;
}

const norm = (v: unknown) => stripHtml(String(v ?? '')).toLowerCase();

/**
 * How well one record answers the query.
 *
 * A name match outweighs a description match by a wide margin, so searching
 * "arabela" puts the restaurant first rather than every entry that mentions it.
 * Each query word must appear somewhere, which is what stops a two-word search
 * from returning everything that matched either half.
 */
function scoreOf(words: string[], name: string, body: string): number {
  const n = name.toLowerCase();
  const b = body.toLowerCase();
  let total = 0;

  for (const w of words) {
    if (n === w)                total += 100;
    else if (n.startsWith(w))   total += 60;
    else if (n.includes(w))     total += 40;
    else if (b.includes(w))     total += 8;
    else return 0; // a word nothing matched — this record is not an answer
  }
  return total;
}

export async function GET(req: NextRequest) {
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim();
  if (q.length < 2) return NextResponse.json({ hits: [] });

  const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (!words.length) return NextResponse.json({ hits: [] });

  // Every source is best-effort: one table being unreadable should narrow the
  // results, not empty them.
  const [attractions, faqs, events, news, itineraries] = await Promise.allSettled([
    getAllAttractions(), getFaqs(), getEvents(), getNews(), getItineraries(),
  ]);

  const scored: { hit: Hit; score: number }[] = [];
  const add = (hit: Hit, score: number) => { if (score > 0) scored.push({ hit, score }); };

  if (attractions.status === 'fulfilled') {
    for (const a of attractions.value) {
      const at = a.attributes ?? {};
      const body = `${norm(at.description)} ${norm(at.location)} ${norm(at.category)}`;
      add({
        objectID: `attraction-${a.id}`,
        name: at.name,
        description: stripHtml(at.description ?? '').slice(0, 160),
        // The type the search UI colours by, and the id the page resolves —
        // '<type>-<uuid>', which getAllAttractions has already composed.
        type: (a.type === 'heritage' ? 'heritage' : a.type === 'dining' ? 'dining' : 'spot'),
        location: at.location ?? undefined,
        rating: at.rating ?? undefined,
        url: `/attractions/${a.id}`,
      }, scoreOf(words, String(at.name ?? ''), body));
    }
  }

  if (faqs.status === 'fulfilled') {
    for (const f of faqs.value) {
      const at = (f as any).attributes ?? f;
      if (!at.question) continue;
      add({
        objectID: `faq-${(f as any).id}`,
        name: at.question,
        description: stripHtml(at.answer ?? '').slice(0, 160),
        type: 'faq',
        url: `/faq`,
      }, scoreOf(words, String(at.question), norm(at.answer)));
    }
  }

  const simple = (
    result: PromiseSettledResult<any[]>,
    type: Hit['type'],
    url: string,
    bodyKey = 'description',
  ) => {
    if (result.status !== 'fulfilled') return;
    for (const item of result.value) {
      const at = item.attributes ?? item;
      const name = at.title || at.name;
      if (!name) continue;
      add({
        objectID: `${type}-${item.id}`,
        name,
        description: stripHtml(at[bodyKey] ?? at.content ?? '').slice(0, 160),
        type,
        url,
      }, scoreOf(words, String(name), norm(at[bodyKey] ?? at.content)));
    }
  };

  simple(events, 'event', '/news');
  simple(news, 'news' as Hit['type'], '/news', 'content');
  simple(itineraries, 'itinerary', '/itineraries');

  const hits = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(s => s.hit);

  return NextResponse.json({ hits, source: 'database' });
}
