import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  // Fast path: signed session cookie
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session = cookie ? verifySession(cookie) : null;

  let email: string | null = session?.email ?? null;
  let strapiUser: { id?: number; email: string; username?: string } | null = null;

  if (!email) {
    const userToken = (request.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!userToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      const meRes = await fetch(`${STRAPI}/api/users/me`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (!meRes.ok) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      strapiUser = await meRes.json();
      email = strapiUser?.email ?? null;
    } catch {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
  }

  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Look up approved LBO application in Supabase
  const { data, error } = await supabaseServer
    .from('lbo_applications')
    .select('*')
    .eq('email', email)
    .eq('status', 'approved')
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ isLbo: false }, { status: 403 });
  }

  return NextResponse.json({
    isLbo: true,
    application: {
      id:                     data.id,
      business_name:          data.business_name,
      owner_name:             data.owner_name,
      email:                  data.email,
      phone:                  data.phone,
      address:                data.address,
      attraction_name:        data.attraction_name,
      business_type:          data.business_type,
      category:               data.category ?? null,
      latitude:               data.latitude ?? null,
      longitude:              data.longitude ?? null,
      strapi_attraction_id:   data.strapi_attraction_id ?? null,
      strapi_attraction_type: data.strapi_attraction_type ?? null,
    },
    user: { id: strapiUser?.id, email, username: strapiUser?.username },
  });
}
