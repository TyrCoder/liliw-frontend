import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, explainDbError } from '@/lib/supabase-server';
import { getCmsIdentity, CMS_TABLES } from '@/lib/cms-auth';
import { logCmsAction } from '@/lib/cms-audit';
import { invalidateContentCache } from '@/lib/content';

type Params = { params: Promise<{ type: string; id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { type, id } = await params;
  const table = CMS_TABLES[type];
  if (!table) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });

  const { role, email } = await getCmsIdentity(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'editor') return NextResponse.json({ error: 'Editors cannot approve content' }, { status: 403 });

  // See the note in submit/route.ts — no CMS table has name, title and
  // question, so selecting all three failed and every entry read as missing.
  const { data: existing } = await supabaseServer.from(table).select('*').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending entries can be approved' }, { status: 409 });
  }

  const { error } = await supabaseServer
    .from(table)
    .update({
      status:         'approved',
      reviewed_by:    email,
      reject_remarks: null,
      published_at:   new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: explainDbError(error) }, { status: 500 });

  const entryTitle = existing.name || existing.title || existing.question || id;
  logCmsAction({ table, entryId: id, entryTitle: String(entryTitle), event: 'entry.publish', performedBy: email, role });
  invalidateContentCache();
  return NextResponse.json({ success: true });
}
