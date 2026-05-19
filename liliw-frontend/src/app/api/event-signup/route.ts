import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { supabaseServer as supabase } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

const STRAPI       = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const { eventId, event_title, full_name, email, phone, notes, strapi_user_id, username } = await request.json();

    if (!eventId || !full_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save to Strapi
    const strapiRes = await fetch(`${STRAPI}/api/event-signups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          event: eventId,
          full_name,
          email,
          phone: phone || '',
          notes: notes || '',
          strapi_user_id: strapi_user_id || null,
          username: username || '',
          status: 'pending',
        },
      }),
    });

    if (!strapiRes.ok) {
      const err = await strapiRes.text();
      logger.error('Strapi event-signup error:', err);
    }

    // Save to Supabase
    const { error: sbError } = await supabase
      .from('event_signups')
      .insert({
        event_id: eventId,
        event_title: event_title || '',
        full_name,
        email,
        phone: phone || '',
        notes: notes || '',
        strapi_user_id: strapi_user_id || null,
        username: username || '',
        status: 'pending',
      });

    if (sbError) logger.error('Supabase event-signup error:', sbError);

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('event-signup route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const res = await fetch(
      `${STRAPI}/api/event-signups?populate=event&sort=createdAt:desc&pagination[limit]=200`,
      { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }, next: { revalidate: 0 } }
    );
    if (!res.ok) throw new Error('Strapi error');
    const data = await res.json();
    return NextResponse.json({ success: true, data: data.data || [] });
  } catch {
    return NextResponse.json({ success: false, data: [] });
  }
}
