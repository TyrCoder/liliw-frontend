import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getCmsIdentity, CMS_TABLES } from '@/lib/cms-auth';
import { logCmsAction } from '@/lib/cms-audit';
import { invalidateContentCache } from '@/lib/content';

type Params = { params: Promise<{ type: string; id: string }> };

/**
 * Brings an archived entry back as a draft.
 *
 * Deliberately not straight back to approved: an entry was archived for a
 * reason, and whoever restores it should look at it and put it through review
 * again rather than have it reappear on the public site the instant someone
 * clicks Restore.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { type, id } = await params;
  const table = CMS_TABLES[type];
  if (!table) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });

  const { role, email } = await getCmsIdentity(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // The archive is an admin and officer view, so restoring from it is too.
  if (role === 'editor') {
    return NextResponse.json({ error: 'Only an admin or officer can restore archived content' }, { status: 403 });
  }

  const { data: existing } = await supabaseServer.from(table).select('*').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'archived') {
    return NextResponse.json({ error: 'Only archived entries can be restored' }, { status: 409 });
  }

  const { error } = await supabaseServer
    .from(table)
    .update({ status: 'draft', reject_remarks: null })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entryTitle = existing.name || existing.title || existing.question || id;
  logCmsAction({ table, entryId: id, entryTitle: String(entryTitle), event: 'entry.restore', performedBy: email, role });
  invalidateContentCache();

  return NextResponse.json({ success: true });
}
