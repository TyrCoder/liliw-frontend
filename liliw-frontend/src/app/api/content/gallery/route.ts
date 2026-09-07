import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { publicAttractionId } from '@/lib/content';

/**
 * Every approved photo on the site, with the page it belongs to.
 *
 * The gallery is assembled from cms_media, which records the content_type and
 * content_id of whatever each file was uploaded against. That was read only to
 * decide a colour and then discarded, so a visitor who found a photograph they
 * liked had no way to reach the artisan or the attraction it was taken for —
 * the gallery was a dead end with 147 pictures in it.
 *
 * Each row now carries where it came from, which costs one extra column per
 * table on a query that was already being made to check approval.
 */

const SOURCES = {
  attraction: { table: 'cms_attractions', columns: 'id,name,category' },
  art_form:   { table: 'cms_art_forms',   columns: 'id,name' },
  artisan:    { table: 'cms_artisans',    columns: 'id,name' },
  story:      { table: 'cms_stories',     columns: 'id,title,slug' },
  event:      { table: 'cms_events',      columns: 'id,title,slug' },
  news:       { table: 'cms_news',        columns: 'id,title' },
} as const;

const CATEGORY: Record<string, string> = {
  attraction: 'heritage', art_form: 'culture', artisan: 'community',
  story: 'culture', event: 'events', news: 'community',
};

/** What the visitor is told they are being taken to. */
const PLACE: Record<string, string> = {
  attraction: 'attraction', art_form: 'art form', artisan: 'artisan',
  story: 'story', event: 'event', news: 'news',
};

type Row = Record<string, unknown>;

/**
 * Where a photo's parent lives.
 *
 * Artisans and art forms have no page of their own — both are sections of
 * /arts — so they link there rather than to a route that would 404. An
 * attraction's public id is '<kind>-<uuid>' and not the bare uuid the table is
 * keyed on, which is the same distinction that once made every search result
 * lead to "attraction not found".
 */
function hrefFor(type: string, row: Row): string | null {
  const id = String(row.id ?? '');
  switch (type) {
    case 'attraction': return `/attractions/${publicAttractionId(String(row.category ?? ''), id)}`;
    case 'story':      return row.slug ? `/stories/${row.slug}` : '/stories';
    case 'event':      return row.slug ? `/community/events/${row.slug}` : '/community';
    case 'artisan':
    case 'art_form':   return '/arts';
    case 'news':       return '/news';
    default:           return null;
  }
}

export async function GET() {
  try {
    const { data: media } = await supabaseServer
      .from('cms_media')
      .select('*')
      .order('sort_order', { ascending: true });

    // One lookup per content type, keyed by id, holding just enough to build a
    // link and name the destination.
    const parents: Record<string, Map<string, Row>> = {};
    await Promise.all(
      Object.entries(SOURCES).map(async ([type, { table, columns }]) => {
        const { data } = await supabaseServer.from(table).select(columns).eq('status', 'approved');
        parents[type] = new Map(((data ?? []) as unknown as Row[]).map(r => [String(r.id), r]));
      }),
    );

    const data = (media ?? []).flatMap((m: Row, i: number) => {
      const type = String(m.content_type ?? '');
      const parent = parents[type]?.get(String(m.content_id ?? ''));
      // Unapproved or deleted parent — the photo is not public either.
      if (!parent) return [];

      const name = String(parent.name ?? parent.title ?? '');
      return [{
        id: `${type}-${m.content_id}-${i}`,
        attributes: {
          title: (m.alt_text as string) || name,
          description: '',
          category: CATEGORY[type] ?? 'heritage',
          image: { data: { attributes: { url: m.url, formats: {} } } },
          source: {
            type,
            name,
            kind: PLACE[type] ?? type,
            href: hrefFor(type, parent),
          },
        },
      }];
    });

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
