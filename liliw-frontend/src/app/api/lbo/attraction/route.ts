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
    .select('attraction_name, business_type, category, address, latitude, longitude, strapi_attraction_type')
    .eq('email', email)
    .eq('status', 'approved')
    .single();

  if (!app) return NextResponse.json({ error: 'No approved LBO application found' }, { status: 403 });

  return NextResponse.json({
    linked: true,
    type: app.strapi_attraction_type ?? app.business_type ?? null,
    attraction: {
      name:        app.attraction_name || '—',
      description: null,
      location:    app.address ?? null,
      category:    app.category ?? null,
      photos:      [],
      rating:      null,
      latitude:    app.latitude ?? null,
      longitude:   app.longitude ?? null,
    },
  });
}
