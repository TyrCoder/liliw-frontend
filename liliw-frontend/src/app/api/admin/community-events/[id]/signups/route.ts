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
