import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = req.headers.get('authorization')?.slice(7) ?? '';
  const { data: { user } } = await supabaseServer.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Could not fetch user' }, { status: 401 });

  const { username, full_name } = await req.json();

  if (username?.trim()) {
    await supabaseServer.from('profiles').update({ username: username.trim() }).eq('id', user.id);
  }

  if (full_name !== undefined) {
    await supabaseServer.from('tourist_profiles')
      .upsert({ email: user.email!.toLowerCase(), full_name: full_name?.trim() || null }, { onConflict: 'email' });
  }

  return NextResponse.json({ success: true });
}
