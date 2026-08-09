import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { supabaseServer, explainDbError } from '@/lib/supabase-server';
import { getCmsIdentity } from '@/lib/cms-auth';

type Params = { params: Promise<{ id: string }> };

/** Everyone who has joined one event, oldest first — the order they signed up. */
export async function GET(request: NextRequest, { params }: Params) {
  if (!await requireStaffAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const { data, error } = await supabaseServer
    .from('community_event_signups')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, data: [], error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: data || [] });
}

/**
 * Records someone the office signed up off the website — a walk-in, a phone
 * call, a name on a sheet at the barangay hall.
 *
 * Deliberately looser than the public route: no check on the event being open
 * or full, because staff adding a person already know both and may be
 * recording someone they accepted deliberately. What is still enforced is the
 * one rule that protects the data — the same person cannot be entered twice.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { role } = await getCmsIdentity(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'editor') {
    return NextResponse.json({ error: 'Only an admin or officer can add participants' }, { status: 403 });
  }

  const { id } = await params;
  const { full_name, email, phone, message, status } = await request.json();

  if (!full_name?.trim()) {
    return NextResponse.json({ error: 'A name is required' }, { status: 400 });
  }
  if (email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'That email address does not look right' }, { status: 400 });
  }

  const { data: event } = await supabaseServer
    .from('cms_community_events')
    .select('id, title')
    .eq('id', id)
    .single();
  if (!event) return NextResponse.json({ error: 'That event no longer exists' }, { status: 404 });

  const { data: signup, error } = await supabaseServer
    .from('community_event_signups')
    .insert({
      event_id:    id,
      event_title: event.title,
      full_name:   full_name.trim(),
      // NULL rather than '': the unique index treats NULLs as distinct, so any
      // number of participants with no email can be recorded, while two
      // sign-ups sharing a real address are still caught.
      email:       email?.trim() ? email.trim().toLowerCase() : null,
      phone:       (phone || '').trim(),
      message:     (message || '').trim(),
      // Someone the office entered by hand has already been accepted.
      status:      ['new', 'confirmed', 'cancelled'].includes(status) ? status : 'confirmed',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Someone with that email is already signed up for this event.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: explainDbError(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true, signup }, { status: 201 });
}

/**
 * Confirms or cancels one person's place.
 *
 * Admin and officer only — editors write content and have no business in the
 * public's contact details.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { role } = await getCmsIdentity(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'editor') {
    return NextResponse.json({ error: 'Only an admin or officer can manage sign-ups' }, { status: 403 });
  }

  const { id } = await params;
  const { signupId, status } = await request.json();
  if (!signupId || !['new', 'confirmed', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
  }

  // Scoped to the event in the URL so a signup id from elsewhere cannot be
  // changed through this route.
  const { error } = await supabaseServer
    .from('community_event_signups')
    .update({ status })
    .eq('id', signupId)
    .eq('event_id', id);

  if (error) return NextResponse.json({ error: explainDbError(error) }, { status: 500 });
  return NextResponse.json({ success: true });
}
