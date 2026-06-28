import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getCmsIdentity, CMS_TABLES } from '@/lib/cms-auth';
import { logCmsAction } from '@/lib/cms-audit';

type Params = { params: Promise<{ type: string; id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { type, id } = await params;
  const table = CMS_TABLES[type];
  if (!table) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });

  const { role, email } = await getCmsIdentity(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'editor') return NextResponse.json({ error: 'Editors cannot approve content' }, { status: 403 });

  const { data: existing } = await supabaseServer.from(table).select('status, name, title, question').eq('id', id).single();
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entryTitle = existing.name || existing.title || existing.question || id;
  logCmsAction({ table, entryId: id, entryTitle: String(entryTitle), event: 'entry.publish', performedBy: email, role });
  return NextResponse.json({ success: true });
}
