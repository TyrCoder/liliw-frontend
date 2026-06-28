import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user: me } } = await supabaseServer.auth.getUser(token);
  if (!me) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data } = await supabaseServer
    .from('tourist_profiles')
    .select('user_type, full_name')
    .eq('email', (me.email as string).toLowerCase())
    .single();

  return NextResponse.json({ user_type: data?.user_type ?? null, full_name: data?.full_name ?? null });
}
