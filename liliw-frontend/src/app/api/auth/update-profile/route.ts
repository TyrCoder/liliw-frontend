import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

const USER_TYPES = ['liliw_local', 'laguna', 'provincial', 'international'];

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = req.headers.get('authorization')?.slice(7) ?? '';
  const { data: { user } } = await supabaseServer.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Could not fetch user' }, { status: 401 });

  const { username, full_name, user_type } = await req.json();

  if (username?.trim()) {
    await supabaseServer.from('profiles').update({ username: username.trim() }).eq('id', user.id);
  }

  // user_type drives the passport's nationality line and the visitor-mix
  // reporting, so only the four registration values are accepted — a client
  // must not be able to write free text into the column.
  if (user_type !== undefined && user_type !== '' && !USER_TYPES.includes(user_type)) {
    return NextResponse.json({ error: 'Invalid visitor type' }, { status: 400 });
  }

  if (full_name !== undefined || user_type !== undefined) {
    const patch: Record<string, string | null> = { email: user.email!.toLowerCase() };
    if (full_name !== undefined) patch.full_name = full_name?.trim() || null;
    if (user_type !== undefined) patch.user_type = user_type || null;

    await supabaseServer.from('tourist_profiles').upsert(patch, { onConflict: 'email' });
  }

  return NextResponse.json({ success: true });
}
