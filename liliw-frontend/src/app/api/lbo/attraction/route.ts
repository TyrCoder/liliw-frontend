import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

async function getEmail(req: NextRequest): Promise<string | null> {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = cookie ? verifySession(cookie) : null;
  if (session?.email) return session.email;

  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!token) return null;
  try {
    const { data: { user } } = await supabaseServer.auth.getUser(token);
    return user?.email ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const email = await getEmail(request);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: app } = await supabaseServer
    .from('lbo_applications')
    .select('attraction_name, business_type, category, address, latitude, longitude, strapi_attraction_type, strapi_attraction_id')
    .eq('email', email)
    .eq('status', 'approved')
    .single();

  if (!app) return NextResponse.json({ error: 'No approved LBO application found' }, { status: 403 });

  // The application row only carries what the owner typed when applying, which
  // is why the dashboard used to show a bare name and address with description
  // and photos hardcoded empty. The published listing lives in cms_attractions,
  // so pull that (and its media) and let the application fill any gaps.
  let cms: Record<string, any> | null = null;
  let photos: { url: string; alt: string | null }[] = [];

  if (app.strapi_attraction_id) {
    const { data: row } = await supabaseServer
      .from('cms_attractions')
      .select('id, name, category, description, features, location, map_lat, map_lng, slug, updated_at, virtual_tour_photos')
      .eq('id', app.strapi_attraction_id)
      .maybeSingle();
    cms = row ?? null;

    if (cms) {
      const { data: media } = await supabaseServer
        .from('cms_media')
        .select('url, alt_text, sort_order')
        .eq('content_id', cms.id)
        .order('sort_order', { ascending: true });
      photos = (media ?? []).map(m => ({ url: m.url, alt: m.alt_text ?? null }));
    }
  }

  // Ratings come from visitor reviews, filed under the '<type>-<uuid>' id the
  // public pages use — same source as the star average shown on the listing.
  const type = app.strapi_attraction_type ?? app.business_type ?? null;
  let rating: number | null = null;
  let reviewCount = 0;
  if (cms && type) {
    const { data: revs } = await supabaseServer
      .from('reviews').select('rating').eq('item_id', `${type}-${cms.id}`);
    if (revs?.length) {
      reviewCount = revs.length;
      rating = revs.reduce((sum, r) => sum + (r.rating || 0), 0) / revs.length;
    }
  }

  // The 360° tour is uploaded by CHATO staff on /immersive, not by the owner —
  // the dashboard only reports whether one exists so they know whether to ask
  // for it. An empty array counts as none: that is what a cleared tour leaves.
  const tourScenes = Array.isArray(cms?.virtual_tour_photos) ? cms.virtual_tour_photos.length : 0;

  return NextResponse.json({
    linked: true,
    type,
    virtualTour: { exists: tourScenes > 0, scenes: tourScenes },
    attraction: {
      id:          cms?.id ?? null,
      slug:        cms?.slug ?? null,
      name:        cms?.name ?? app.attraction_name ?? '—',
      description: cms?.description ?? null,
      features:    cms?.features ?? null,
      location:    cms?.location ?? app.address ?? null,
      category:    cms?.category ?? app.category ?? null,
      photos,
      rating,
      reviewCount,
      latitude:    cms?.map_lat ?? app.latitude ?? null,
      longitude:   cms?.map_lng ?? app.longitude ?? null,
      updatedAt:   cms?.updated_at ?? null,
      published:   !!cms,
    },
  });
}
