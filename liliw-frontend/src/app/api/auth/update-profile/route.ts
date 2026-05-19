import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { getStrapiAdminJwt, getStrapiUserByEmail, updateStrapiUser } from '@/lib/strapi-admin';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = req.headers.get('authorization')?.slice(7) ?? '';
  const meRes = await fetch(`${STRAPI}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meRes.ok) return NextResponse.json({ error: 'Could not fetch user' }, { status: 401 });
  const me = await meRes.json();

  const { username, full_name } = await req.json();

  if (username && username.trim()) {
    const jwt = await getStrapiAdminJwt();
    if (jwt) {
      const strapiUser = await getStrapiUserByEmail(me.email, jwt);
      if (strapiUser) {
        await updateStrapiUser(strapiUser.documentId, { username: username.trim() }, jwt);
      }
    }
  }

  if (full_name !== undefined) {
    await supabaseServer
      .from('tourist_profiles')
      .upsert(
        { email: me.email.toLowerCase(), full_name: full_name?.trim() || null },
        { onConflict: 'email' }
      );
  }

  return NextResponse.json({ success: true });
}
