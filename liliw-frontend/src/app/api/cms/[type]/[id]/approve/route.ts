import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getCmsRole, CMS_TABLES } from '@/lib/cms-auth';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

type Params = { params: Promise<{ type: string; id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { type, id } = await params;
  const table = CMS_TABLES[type];
  if (!table) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });

  const role = await getCmsRole(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'editor') return NextResponse.json({ error: 'Editors cannot approve content' }, { status: 403 });

  const { data: existing } = await supabaseServer.from(table).select('status').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending entries can be approved' }, { status: 409 });
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = cookie ? verifySession(cookie) : null;
  const reviewerEmail = session?.email ?? 'officer';

  const { error } = await supabaseServer
    .from(table)
    .update({
      status:        'approved',
      reviewed_by:   reviewerEmail,
      reject_remarks: null,
      published_at:  new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
