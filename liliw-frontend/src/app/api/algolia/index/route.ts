import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import algoliasearch from 'algoliasearch';
import { requireAdminAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { stripHtml } from '@/lib/text';

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
        supabaseServer.from('cms_attractions').select('id,name,category,description,location').eq('status','approved'),
        supabaseServer.from('cms_events').select('id,title,category,description,venue').eq('status','approved'),
        supabaseServer.from('cms_faqs').select('id,question,answer,category').eq('status','approved'),
        supabaseServer.from('cms_itineraries').select('id,title,description,category,duration_days').eq('status','approved'),
        supabaseServer.from('cms_art_forms').select('id,name,description').eq('status','approved'),
        supabaseServer.from('cms_artisans').select('id,name,craft_type,description,location').eq('status','approved'),
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
        url:         `/attractions/${item.id}`,
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

    await index.saveObjects(objects);

    return NextResponse.json({
      success: true,
      message: `Successfully indexed ${objects.length} items to Algolia`,
      count: objects.length,
      breakdown: {
        attractions: objects.filter(o => o.type === 'attraction').length,
        events:      objects.filter(o => o.type === 'event').length,
        faqs:        objects.filter(o => o.type === 'faq').length,
        itineraries: objects.filter(o => o.type === 'itinerary').length,
        art_forms:   objects.filter(o => o.type === 'art_form').length,
        artisans:    objects.filter(o => o.type === 'artisan').length,
        stories:     objects.filter(o => o.type === 'story').length,
        news:        objects.filter(o => o.type === 'news').length,
      },
    });
  } catch (error) {
    logger.error('Algolia indexing error:', error);
    return NextResponse.json({ error: 'Failed to index to Algolia', details: String(error) }, { status: 500 });
  }
}
