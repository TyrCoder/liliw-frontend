import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireStaffAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

const APIFY_TOKEN  = process.env.APIFY_TOKEN || '';
const ACTOR_ID     = 'compass~crawler-google-places';
const APIFY_BASE   = 'https://api.apify.com/v2';

/* ── POST — start a scrape run ── */
export async function POST(req: NextRequest) {
  if (!await requireStaffAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { strapiId, attractionName, lat, lng } = await req.json();
  if (!strapiId || !attractionName) {
    return NextResponse.json({ error: 'strapiId and attractionName required' }, { status: 400 });
  }

  const input = {
    searchStringsArray:        [attractionName],
    ...(lat && lng ? { lat: Number(lat), lng: Number(lng), zoom: 15 } : {}),
    maxCrawledPlacesPerSearch: 1,
    maxReviews:                3,
    language:                  'en',
    reviewsSort:               'newest',
  };

  const res = await fetch(`${APIFY_BASE}/acts/${ACTOR_ID}/runs`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${APIFY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Apify error: ${err}` }, { status: 502 });
  }

  const { data } = await res.json();
  return NextResponse.json({ runId: data.id, datasetId: data.defaultDatasetId });
}

/* ── GET — poll run status; save & return results when done ── */
export async function GET(req: NextRequest) {
  if (!await requireStaffAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const runId      = searchParams.get('runId');
  const strapiId   = searchParams.get('strapiId');
  const attrName   = searchParams.get('attractionName') || '';

  if (!runId) return NextResponse.json({ error: 'runId required' }, { status: 400 });

  // Check run status
  const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}`, {
    headers: { Authorization: `Bearer ${APIFY_TOKEN}` },
  });
  const { data: run } = await statusRes.json();
  const status = run?.status;

  if (status !== 'SUCCEEDED') {
    return NextResponse.json({ status: status || 'RUNNING' });
  }

  // Fetch dataset items
  const itemsRes = await fetch(
    `${APIFY_BASE}/datasets/${run.defaultDatasetId}/items?clean=true&format=json`,
    { headers: { Authorization: `Bearer ${APIFY_TOKEN}` } }
  );
  const items: any[] = await itemsRes.json();
  const place = items?.[0];

  if (!place) {
    return NextResponse.json({ status: 'SUCCEEDED', result: null, message: 'No matching place found on Google Maps' });
  }

  const googleRating  = place.totalScore ?? place.rating ?? null;
  const reviewCount   = place.reviewsCount ?? place.userRatingsTotal ?? 0;
  const reviews       = (place.reviews ?? []).map((r: any) => ({
    author:    r.name ?? r.reviewerName ?? 'Anonymous',
    rating:    r.stars ?? r.rating ?? 0,
    text:      r.text ?? r.reviewText ?? '',
    published: r.publishAt ?? r.date ?? null,
  }));

  // Save / update in Supabase
  if (strapiId) {
    const { error: dbErr } = await supabase.from('external_reviews').upsert({
      strapi_id:       strapiId,
      attraction_name: attrName,
      google_rating:   googleRating,
      review_count:    reviewCount,
      reviews,
      last_scraped_at: new Date().toISOString(),
    }, { onConflict: 'strapi_id' });
    if (dbErr) console.error('[scrape-reviews] Supabase upsert error:', dbErr.message);
  }

  return NextResponse.json({
    status: 'SUCCEEDED',
    result: { googleRating, reviewCount, reviews, placeName: place.title ?? attrName },
  });
}
