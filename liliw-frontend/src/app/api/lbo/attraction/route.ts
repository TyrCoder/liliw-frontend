import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

const TYPE_PATH: Record<string, string> = {
  heritage: 'heritage-sites',
  spot:     'tourist-spots',
  dining:   'dining-and-foods',
};

export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const meRes = await fetch(`${STRAPI}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meRes.ok) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  const user = await meRes.json();

  const { data: app } = await supabaseServer
    .from('lbo_applications')
    .select('strapi_attraction_id, strapi_attraction_type')
    .eq('email', user.email)
    .eq('status', 'approved')
    .single();

  if (!app) return NextResponse.json({ error: 'No approved LBO application found' }, { status: 403 });

  if (!app.strapi_attraction_id || !app.strapi_attraction_type) {
    return NextResponse.json({ linked: false });
  }

  const path = TYPE_PATH[app.strapi_attraction_type];
  if (!path) return NextResponse.json({ linked: false });

  const strapiRes = await fetch(
    `${STRAPI}/api/${path}/${app.strapi_attraction_id}?populate=photos`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );

  if (!strapiRes.ok) {
    return NextResponse.json({ linked: true, error: 'Attraction not found in Strapi' }, { status: 404 });
  }

  const json = await strapiRes.json();
  const attr = json.data?.attributes || json.data || {};

  return NextResponse.json({
    linked:   true,
    type:     app.strapi_attraction_type,
    strapiId: app.strapi_attraction_id,
    attraction: {
      name:        attr.name || attr.title || '—',
      description: attr.description || attr.content || null,
      location:    attr.location || attr.address || null,
      category:    attr.category || null,
      photos:      attr.photos?.data || [],
      rating:      attr.rating ?? null,
    },
  });
}
