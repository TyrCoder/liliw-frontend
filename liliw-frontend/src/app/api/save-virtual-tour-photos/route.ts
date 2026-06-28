import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const isAdmin = await requireAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { attractionId, photos } = await req.json();

    if (!attractionId) {
      return NextResponse.json({ error: 'attractionId is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('cms_attractions')
      .update({ virtual_tour_photos: photos })
      .eq('id', attractionId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
