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
  if (role === 'editor') return NextResponse.json({ error: 'Editors cannot reject content' }, { status: 403 });

  const body = await req.json();
  const { remarks } = body;
  if (!remarks?.trim()) return NextResponse.json({ error: 'Rejection remarks are required' }, { status: 400 });

  const { data: existing } = await supabaseServer.from(table).select('status, name, title, question').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending entries can be rejected' }, { status: 409 });
  }

  const { error } = await supabaseServer
    .from(table)
    .update({
      status:         'rejected',
      reviewed_by:    email,
      reject_remarks: remarks.trim(),
      published_at:   null,
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entryTitle = existing.name || existing.title || existing.question || id;
  logCmsAction({ table, entryId: id, entryTitle: String(entryTitle), event: 'entry.unpublish', performedBy: email, role });
  return NextResponse.json({ success: true });
}
