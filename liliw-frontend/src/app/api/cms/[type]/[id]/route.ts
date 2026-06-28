import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getCmsIdentity, getCmsRole, CMS_TABLES } from '@/lib/cms-auth';
import { logCmsAction } from '@/lib/cms-audit';

type Params = { params: Promise<{ type: string; id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { type, id } = await params;
  const table = CMS_TABLES[type];
  if (!table) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });

  const { data, error } = await supabaseServer
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const role = await getCmsRole(req);
  if (data.status !== 'approved' && !role) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { type, id } = await params;
  const table = CMS_TABLES[type];
  if (!table) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });

  const { role, email } = await getCmsIdentity(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'officer') return NextResponse.json({ error: 'Officers cannot edit content' }, { status: 403 });

  const { data: existing } = await supabaseServer.from(table).select('status').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status === 'pending') {
    return NextResponse.json({ error: 'Pending entries cannot be edited' }, { status: 409 });
  }

  const body = await req.json();
  const { media, created_by, status, published_at, reviewed_by, reject_remarks, ...fields } = body;

  const { data, error } = await supabaseServer
    .from(table)
    .update({ ...fields, status: 'draft' })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const title = data?.name || data?.title || data?.question || id;
  logCmsAction({ table, entryId: id, entryTitle: String(title), event: 'entry.update', performedBy: email, role });

  // Replace media if provided
  if (Array.isArray(media)) {
    await supabaseServer.from('cms_media').delete().eq('content_id', id);
    if (media.length > 0) {
      const contentType = type === 'art-forms' ? 'art_form' : type.replace(/-/g, '_').replace(/s$/, '');
      const mediaRows = media.map((m: { url: string; public_id?: string; alt_text?: string }, i: number) => ({
        content_type: contentType,
        content_id: id,
        url: m.url,
        public_id: m.public_id ?? null,
        alt_text: m.alt_text ?? null,
        sort_order: i,
      }));
      await supabaseServer.from('cms_media').insert(mediaRows);
    }
  }

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { type, id } = await params;
  const table = CMS_TABLES[type];
  if (!table) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });

  const { role, email } = await getCmsIdentity(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'officer') return NextResponse.json({ error: 'Officers cannot delete content' }, { status: 403 });

  const { data: existing } = await supabaseServer.from(table).select('status, name, title, question').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status === 'pending') {
    return NextResponse.json({ error: 'Pending entries cannot be deleted' }, { status: 409 });
  }

  const entryTitle = existing.name || existing.title || existing.question || id;
  await supabaseServer.from('cms_media').delete().eq('content_id', id);
  const { error } = await supabaseServer.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logCmsAction({ table, entryId: id, entryTitle: String(entryTitle), event: 'entry.delete', performedBy: email, role });
  return NextResponse.json({ success: true });
}
