import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { supabaseServer as supabase } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/verifyToken';
import { awardPoints } from '@/lib/achievements';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { eventId, event_title, full_name, email, phone, notes, username } = await request.json();

    if (!eventId || !full_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error: sbError } = await supabase
      .from('event_signups')
      .insert({
        event_id:    eventId,
        event_title: event_title || '',
        full_name,
        email,
        phone:    phone    || '',
        notes:    notes    || '',
        username: username || '',
        status:   'pending',
      });

    if (sbError) logger.error('Supabase event-signup error:', sbError);

    // Award points if user is logged in
    const auth = await verifyToken(request);
    if (auth?.userId && eventId) {
      awardPoints(auth.userId, 'event_signup', String(eventId), event_title || 'Event').catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('event-signup route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data } = await supabase
      .from('event_signups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    // Shape into the format the admin page expects (Strapi v4-compatible)
    const shaped = (data ?? []).map(row => ({
      id: row.id,
      attributes: {
        full_name:  row.full_name,
        email:      row.email,
        phone:      row.phone  || '',
        notes:      row.notes  || '',
        username:   row.username || '',
        status:     row.status,
        createdAt:  row.created_at,
        event: {
          data: {
            id: row.event_id,
            attributes: { title: row.event_title, date_start: '' },
          },
        },
      },
    }));

    return NextResponse.json({ success: true, data: shaped });
  } catch {
    return NextResponse.json({ success: false, data: [] });
  }
}
