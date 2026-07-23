import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getCmsIdentity, getCmsRole, CMS_TABLES, CMS_CONTENT_TYPES } from '@/lib/cms-auth';
import { logCmsAction } from '@/lib/cms-audit';
import { invalidateContentCache } from '@/lib/content';

type Params = { params: Promise<{ type: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { type } = await params;
  const table = CMS_TABLES[type];
  if (!table) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });

  const role = await getCmsRole(req);
  const isStaff = !!role;

  const query = supabaseServer.from(table).select('*').order('created_at', { ascending: false });

  if (!isStaff) {
    query.eq('status', 'approved');
  } else {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    if (status) query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ data: [], _error: error.message });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { type } = await params;
  const table = CMS_TABLES[type];
  if (!table) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });

  const { role, email } = await getCmsIdentity(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'officer') return NextResponse.json({ error: 'Officers cannot create content' }, { status: 403 });

  const body = await req.json();
  const nameField = type === 'attractions' || type === 'art-forms' || type === 'artisans' ? 'name' : 'title';
  const label = body[nameField] || body.name || body.title;
  if (!label) return NextResponse.json({ error: `${nameField} is required` }, { status: 400 });

  const { created_by, ...rest } = body;
  const insertData = {
    ...rest,
    created_by: created_by || 'staff',
    status: 'draft',
  };

  const { data, error } = await supabaseServer
    .from(table)
    .insert(insertData)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logCmsAction({ table, entryId: data.id, entryTitle: label, event: 'entry.create', performedBy: email, role });
  invalidateContentCache();

  // Attach media if provided
  if (Array.isArray(body.media) && body.media.length > 0) {
    const contentType = CMS_CONTENT_TYPES[type];
    const mediaRows = body.media.map((m: { url: string; public_id?: string; alt_text?: string }, i: number) => ({
      content_type: contentType,
      content_id: data.id,
      url: m.url,
      public_id: m.public_id ?? null,
      alt_text: m.alt_text ?? null,
      sort_order: i,
    }));
    await supabaseServer.from('cms_media').insert(mediaRows);
  }

  return NextResponse.json({ data }, { status: 201 });
}
