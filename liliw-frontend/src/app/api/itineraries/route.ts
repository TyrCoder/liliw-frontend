import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/verifyToken';

export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('saved_itineraries')
    .select('*')
    .eq('user_id', auth.userId)
    .order('saved_at', { ascending: false });

  if (error) {
    console.error('[itineraries GET]', error.code, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ trips: data });
}

export async function POST(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, plan, duration, budget } = await req.json();
  if (!title || !plan) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const { data, error } = await supabaseServer
    .from('saved_itineraries')
    .insert({ user_id: auth.userId, title, plan, duration, budget })
    .select()
    .single();

  if (error) {
    console.error('[itineraries POST]', error.code, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ trip: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabaseServer
    .from('saved_itineraries')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.userId);

  if (error) {
    console.error('[itineraries DELETE]', error.code, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
