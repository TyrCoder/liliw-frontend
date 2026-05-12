import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/verifyToken';

export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('saved_favorites')
    .select('*')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ favorites: [] });
  return NextResponse.json({ favorites: data });
}

export async function POST(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { attraction_id, name, type, category } = await req.json();
  if (!attraction_id || !name || !type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('saved_favorites')
    .upsert(
      { user_id: auth.userId, attraction_id, name, type, category: category ?? null },
      { onConflict: 'user_id,attraction_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorite: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const attractionId = req.nextUrl.searchParams.get('attraction_id');
  if (!attractionId) return NextResponse.json({ error: 'Missing attraction_id' }, { status: 400 });

  const { error } = await supabase
    .from('saved_favorites')
    .delete()
    .eq('user_id', auth.userId)
    .eq('attraction_id', attractionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
