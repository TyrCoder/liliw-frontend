import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getCmsIdentity, getCmsRole, CMS_TABLES, CMS_CONTENT_TYPES, slugify, labelFieldFor } from '@/lib/cms-auth';
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
    if (status) {
      // The archive is an admin and officer view; an editor asking for it
      // directly gets nothing rather than a listing they should not have.
      if (status === 'archived' && role === 'editor') {
        return NextResponse.json({ data: [] });
      }
      query.eq('status', status);
    } else if (role === 'editor') {
      // Archived entries are otherwise invisible to editors, so "All" does not
      // quietly include what they cannot act on.
      query.neq('status', 'archived');
    }
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
  // FAQs are labelled by `question`, which the old inference did not know
  // about — it asked for a title, found none, and refused to create one.
  const nameField = labelFieldFor(type);
  const label = body[nameField] || body.name || body.title || body.question;
  if (!label) return NextResponse.json({ error: `${nameField} is required` }, { status: 400 });

  // `media` is not a column — photos live in cms_media and are attached below.
  // It was being passed straight into the insert, so creating anything with a
  // photo field failed with "Could not find the 'media' column". PUT has always
  // stripped it; POST never did. The rest are server-owned: a client must not
  // be able to create an entry that is already approved, or backdate one.
  const {
    created_by, media, id, status, published_at, reviewed_by, created_at, updated_at,
    ...rest
  } = body;

  const insertData: Record<string, unknown> = {
    ...rest,
    created_by: created_by || 'staff',
    status: 'draft',
  };

  // slug is unique and the form never fills it, so without this every entry
  // after the first in a table collided on the empty string.
  if (!insertData.slug || typeof insertData.slug !== 'string' || !insertData.slug.trim()) {
    insertData.slug = slugify(String(label)) || `entry-${Date.now().toString(36)}`;
  }

  let { data, error } = await supabaseServer.from(table).insert(insertData).select().single();

  // Two entries can legitimately share a title. Rather than refuse the second,
  // give it a distinct slug and try once more.
  if (error?.code === '23505') {
    insertData.slug = `${insertData.slug}-${Date.now().toString(36).slice(-4)}`;
    ({ data, error } = await supabaseServer.from(table).insert(insertData).select().single());
  }

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
    // The entry is already created, so a silent failure here produces content
    // that saved fine and simply has no pictures — reported as "the images
    // didn't upload" long after the fact.
    const { error: mediaError } = await supabaseServer.from('cms_media').insert(mediaRows);
    if (mediaError) {
      return NextResponse.json(
        { data, warning: `Saved, but the images could not be attached: ${mediaError.message}` },
        { status: 201 },
      );
    }
  }

  return NextResponse.json({ data }, { status: 201 });
}
