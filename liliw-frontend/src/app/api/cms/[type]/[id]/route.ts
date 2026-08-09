import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, explainDbError } from '@/lib/supabase-server';
import { getCmsIdentity, getCmsRole, CMS_TABLES, CMS_CONTENT_TYPES, slugify } from '@/lib/cms-auth';
import { logCmsAction } from '@/lib/cms-audit';
import { invalidateContentCache } from '@/lib/content';

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

  // Entries created before slugs were generated still carry '', and slug is
  // unique — so saving a second one would collide the same way creating did.
  if ('slug' in fields && (typeof fields.slug !== 'string' || !fields.slug.trim())) {
    const label = fields.name || fields.title || fields.question || '';
    fields.slug = slugify(String(label)) || `entry-${Date.now().toString(36)}`;
  }

  const { data, error } = await supabaseServer
    .from(table)
    .update({ ...fields, status: 'draft' })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: explainDbError(error) }, { status: 500 });

  const title = data?.name || data?.title || data?.question || id;
  logCmsAction({ table, entryId: id, entryTitle: String(title), event: 'entry.update', performedBy: email, role });
  invalidateContentCache();

  // Replace media if provided
  if (Array.isArray(media)) {
    await supabaseServer.from('cms_media').delete().eq('content_id', id);
    if (media.length > 0) {
      const contentType = CMS_CONTENT_TYPES[type];
      const mediaRows = media.map((m: { url: string; public_id?: string; alt_text?: string }, i: number) => ({
        content_type: contentType,
        content_id: id,
        url: m.url,
        public_id: m.public_id ?? null,
        alt_text: m.alt_text ?? null,
        sort_order: i,
      }));
      // The old rows have already been deleted, so a failure here does not
      // just skip the new images — it leaves the entry with none at all.
      const { error: mediaError } = await supabaseServer.from('cms_media').insert(mediaRows);
      if (mediaError) {
        return NextResponse.json(
          { data, warning: `Saved, but the images could not be attached: ${mediaError.message}` },
        );
      }
    }
  }

  return NextResponse.json({ data });
}

/**
 * Removing an entry archives it rather than destroying it.
 *
 * A delete used to take the row and its photos with it, with a browser confirm
 * as the only thing standing in the way — no undo, and no way to see what had
 * been removed or by whom. Archiving takes it off the public site just as
 * effectively, since every public query asks for `approved`, while leaving it
 * recoverable.
 *
 * `?permanent=1` still destroys the row, but only an admin or officer can ask
 * for that, and only from the archive.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { type, id } = await params;
  const table = CMS_TABLES[type];
  if (!table) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });

  const { role, email } = await getCmsIdentity(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const permanent = new URL(req.url).searchParams.get('permanent') === '1';

  // Archiving is an everyday editorial act; destroying is not. Only admins and
  // officers can do the second, which is also who can see the archive at all.
  if (!permanent && role === 'officer') {
    return NextResponse.json({ error: 'Officers cannot archive content' }, { status: 403 });
  }
  if (permanent && role === 'editor') {
    return NextResponse.json({ error: 'Only an admin or officer can delete permanently' }, { status: 403 });
  }

  const { data: existing } = await supabaseServer.from(table).select('*').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (permanent) {
    if (existing.status !== 'archived') {
      return NextResponse.json(
        { error: 'Only archived entries can be deleted permanently. Archive it first.' },
        { status: 409 },
      );
    }
    const entryTitle = existing.name || existing.title || existing.question || id;
    await supabaseServer.from('cms_media').delete().eq('content_id', id);
    const { error } = await supabaseServer.from(table).delete().eq('id', id);
    if (error) return NextResponse.json({ error: explainDbError(error) }, { status: 500 });

    logCmsAction({ table, entryId: id, entryTitle: String(entryTitle), event: 'entry.delete', performedBy: email, role });
    invalidateContentCache();
    return NextResponse.json({ success: true, permanent: true });
  }

  if (existing.status === 'pending') {
    return NextResponse.json({ error: 'Entries awaiting review cannot be archived' }, { status: 409 });
  }
  if (existing.status === 'archived') {
    return NextResponse.json({ error: 'That entry is already archived' }, { status: 409 });
  }

  const entryTitle = existing.name || existing.title || existing.question || id;
  // Photos stay put — a restored entry with no pictures is barely a restore.
  const { error } = await supabaseServer
    .from(table)
    .update({ status: 'archived' })
    .eq('id', id);
  if (error) return NextResponse.json({ error: explainDbError(error) }, { status: 500 });

  logCmsAction({ table, entryId: id, entryTitle: String(entryTitle), event: 'entry.archive', performedBy: email, role });
  invalidateContentCache();
  return NextResponse.json({ success: true, archived: true });
}
