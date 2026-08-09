import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, explainDbError } from '@/lib/supabase-server';
import { staffNotifyEmails } from '@/lib/staff-emails';
import { sendContactNotification } from '@/lib/email';
import { logger } from '@/lib/logger';

type Params = { params: Promise<{ id: string }> };

/**
 * Signs someone up for a community event.
 *
 * Every check here is repeated on the server rather than trusted from the
 * page: the card can be hours stale, and an event can fill up or close
 * between the page loading and the button being pressed.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { full_name, email, phone, message } = await req.json();

  if (!full_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Your name and email are required' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'That email address does not look right' }, { status: 400 });
  }

  const { data: event } = await supabaseServer
    .from('cms_community_events')
    .select('id, title, status, is_open, slots, contact_email')
    .eq('id', id)
    .single();

  // An unapproved event is not public, so joining one must not be possible
  // even for someone who guessed the id.
  if (!event || event.status !== 'approved') {
    return NextResponse.json({ error: 'That event is not available' }, { status: 404 });
  }
  if (!event.is_open) {
    return NextResponse.json({ error: 'This event is no longer accepting volunteers' }, { status: 409 });
  }

  // Cancelled sign-ups free their place back up, so they are not counted.
  if (event.slots) {
    const { count } = await supabaseServer
      .from('community_event_signups')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id)
      .neq('status', 'cancelled');
    if ((count ?? 0) >= event.slots) {
      return NextResponse.json({ error: 'This event is already full' }, { status: 409 });
    }
  }

  const { data: signup, error } = await supabaseServer
    .from('community_event_signups')
    .insert({
      event_id:    id,
      event_title: event.title,
      full_name:   full_name.trim(),
      email:       email.trim().toLowerCase(),
      phone:       (phone || '').trim(),
      message:     (message || '').trim(),
    })
    .select()
    .single();

  if (error) {
    // The unique index means a second attempt is the same person, not a
    // failure they need to do anything about.
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'You have already signed up for this one — we have your details.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: explainDbError(error) }, { status: 500 });
  }

  // Fire-and-forget: the sign-up is stored, so a mail outage must not report
  // failure to someone whose place is already booked.
  staffNotifyEmails()
    .then(to => sendContactNotification({
      name:    full_name.trim(),
      email:   email.trim(),
      phone:   phone || '',
      type:    `sign-up for ${event.title}`,
      message: (message || '').trim() || '(no message)',
      to:      event.contact_email ? [...to, event.contact_email] : to,
    }))
    .catch(err => logger.error('[community-event join] notification:', err));

  return NextResponse.json({ success: true, signup }, { status: 201 });
}
