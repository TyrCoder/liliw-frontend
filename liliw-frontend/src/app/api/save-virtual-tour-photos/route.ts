import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { invalidateContentCache } from '@/lib/content';

export async function POST(req: NextRequest) {
  const isAdmin = await requireAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { attractionId, strapiId, photos } = await req.json();
    const id = attractionId || strapiId;

    if (!id) {
      return NextResponse.json({ error: 'attractionId is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('cms_attractions')
      .update({ virtual_tour_photos: photos })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // getAllAttractions() caches for five minutes and every CMS write clears
    // it — but these two tour routes never did, so a saved tour kept reading
    // back as empty and looked like it had not saved at all.
    invalidateContentCache();

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
