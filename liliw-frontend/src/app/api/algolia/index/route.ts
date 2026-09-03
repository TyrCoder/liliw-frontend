import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import algoliasearch from 'algoliasearch';
import { requireAdminAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { stripHtml } from '@/lib/text';
import { publicAttractionId } from '@/lib/content';

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
  process.env.ALGOLIA_ADMIN_KEY || ''
);

const index = client.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'liliw-items');

export async function POST(req: NextRequest) {
  const isAdmin = await requireAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const objects: any[] = [];

    const [attractions, events, faqs, itineraries, artForms, artisans, stories, news] =
      await Promise.all([
        supabaseServer.from('cms_attractions').select('id,name,category,description,location,rating').eq('status','approved'),
        supabaseServer.from('cms_events').select('id,title,category,description,venue').eq('status','approved'),
        supabaseServer.from('cms_faqs').select('id,question,answer,category').eq('status','approved'),
        supabaseServer.from('cms_itineraries').select('id,title,description,category,duration_days').eq('status','approved'),
        supabaseServer.from('cms_art_forms').select('id,name,description').eq('status','approved'),
        supabaseServer.from('cms_artisans').select('id,name,craft_type,description,location,rating').eq('status','approved'),
        supabaseServer.from('cms_stories').select('id,title,category,content,author').eq('status','approved'),
        supabaseServer.from('cms_news').select('id,title,category,content').eq('status','approved'),
      ]);

    (attractions.data || []).forEach((item: any) => {
      objects.push({
        objectID:    `attraction-${item.id}`,
        name:        item.name,
        description: stripHtml(item.description),
        type:        'attraction',
        category:    item.category,
        location:    item.location,
        rating:      item.rating ?? 0,
        // The public id is '<type>-<uuid>', not the bare uuid this table is
        // keyed on — see publicAttractionId. Indexed with the raw uuid, every
        // attraction found through search led to a page that does not exist:
        // the route looks up '<type>-<uuid>' and a bare uuid matches nothing,
        // so every single search result answered "attraction not found".
        url:         `/attractions/${publicAttractionId(item.category, item.id)}`,
      });
    });

    (events.data || []).forEach((item: any) => {
      objects.push({
        objectID:    `event-${item.id}`,
        name:        item.title,
        description: stripHtml(item.description),
        type:        'event',
        category:    item.category,
        url:         `/news`,
      });
    });

    (faqs.data || []).forEach((item: any) => {
      objects.push({
        objectID:    `faq-${item.id}`,
        name:        item.question,
        description: stripHtml(item.answer),
        type:        'faq',
        category:    item.category,
        url:         `/faq#faq-${item.id}`,
      });
    });

    (itineraries.data || []).forEach((item: any) => {
      objects.push({
        objectID:    `itinerary-${item.id}`,
        name:        item.title,
        description: stripHtml(item.description),
        type:        'itinerary',
        category:    item.category,
        url:         `/itineraries`,
      });
    });

    (artForms.data || []).forEach((item: any) => {
      objects.push({
        objectID:    `art-form-${item.id}`,
        name:        item.name,
        description: stripHtml(item.description),
        type:        'art_form',
        url:         `/arts`,
      });
    });

    (artisans.data || []).forEach((item: any) => {
      objects.push({
        objectID:    `artisan-${item.id}`,
        name:        item.name,
        description: stripHtml(item.description),
        type:        'artisan',
        category:    item.craft_type,
        location:    item.location,
        rating:      item.rating ?? 0,
        url:         `/arts`,
      });
    });

    (stories.data || []).forEach((item: any) => {
      objects.push({
        objectID:    `story-${item.id}`,
        name:        item.title,
        description: stripHtml(item.content).slice(0, 200),
        type:        'story',
        category:    item.category,
        url:         `/stories/${item.id}`,
      });
    });

    (news.data || []).forEach((item: any) => {
      objects.push({
        objectID:    `news-${item.id}`,
        name:        item.title,
        description: stripHtml(item.content).slice(0, 200),
        type:        'news',
        category:    item.category,
        url:         `/news`,
      });
    });

    if (objects.length === 0) {
      return NextResponse.json({ error: 'No approved content found to index', count: 0 }, { status: 400 });
    }

    /**
     * One entry per thing, whatever the table holds.
     *
     * cms_faqs currently has 29 approved rows and 15 distinct questions —
     * every one stored twice — so half the FAQ results in search were the same
     * answer listed again under a different id. Deduplicated on type and title
     * rather than on id, because the rows are genuinely separate records; the
     * first is kept and the rest dropped.
     *
     * This is a guard, not a repair. The duplicate rows are still in the CMS,
     * still shown to editors, and still sent anywhere else that reads them.
     */
    const seen = new Set<string>();
    const unique = objects.filter(o => {
      const key = `${o.type}:${String(o.name ?? '').trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const duplicatesDropped = objects.length - unique.length;

    // Replace rather than merge. saveObjects only adds and updates, so
    // anything archived or deleted since the last run stayed searchable
    // forever — four archived attractions are still in this index, and finding
    // one leads to a page that no longer exists. replaceAllObjects swaps the
    // whole index atomically, so search reflects what is approved right now.
    await index.replaceAllObjects(unique, { safe: true });

    return NextResponse.json({
      success: true,
      message: `Successfully indexed ${unique.length} items to Algolia${duplicatesDropped ? ` (${duplicatesDropped} duplicate${duplicatesDropped === 1 ? '' : 's'} skipped)` : ''}`,
      count: unique.length,
      duplicatesDropped,
      breakdown: {
        attractions: unique.filter(o => o.type === 'attraction').length,
        events:      unique.filter(o => o.type === 'event').length,
        faqs:        unique.filter(o => o.type === 'faq').length,
        itineraries: unique.filter(o => o.type === 'itinerary').length,
        art_forms:   unique.filter(o => o.type === 'art_form').length,
        artisans:    unique.filter(o => o.type === 'artisan').length,
        stories:     unique.filter(o => o.type === 'story').length,
        news:        unique.filter(o => o.type === 'news').length,
      },
    });
  } catch (error) {
    logger.error('Algolia indexing error:', error);
    return NextResponse.json({ error: 'Failed to index to Algolia', details: String(error) }, { status: 500 });
  }
}
