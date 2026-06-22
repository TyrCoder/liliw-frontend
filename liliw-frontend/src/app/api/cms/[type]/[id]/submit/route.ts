import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getCmsRole, CMS_TABLES } from '@/lib/cms-auth';

type Params = { params: Promise<{ type: string; id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { type, id } = await params;
  const table = CMS_TABLES[type];
  if (!table) return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });

  const role = await getCmsRole(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'officer') return NextResponse.json({ error: 'Officers cannot submit content for approval' }, { status: 403 });

  const { data: existing } = await supabaseServer.from(table).select('status').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!['draft', 'rejected'].includes(existing.status)) {
    return NextResponse.json({ error: 'Only draft or rejected entries can be submitted' }, { status: 409 });
  }

  const { error } = await supabaseServer
    .from(table)
    .update({ status: 'pending', reject_remarks: null })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
