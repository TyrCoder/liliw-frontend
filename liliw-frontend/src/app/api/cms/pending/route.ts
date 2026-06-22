import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getCmsRole, CMS_TABLES } from '@/lib/cms-auth';

export async function GET(req: NextRequest) {
  const role = await getCmsRole(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role === 'editor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const results = await Promise.all(
    Object.entries(CMS_TABLES).map(async ([type, table]) => {
      const nameField = ['attractions', 'art-forms', 'artisans'].includes(type) ? 'name' : 'title';
      const { data } = await supabaseServer
        .from(table)
        .select(`id, ${nameField}, status, created_by, created_at, reject_remarks`)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      return (data || []).map(entry => ({
        ...entry,
        title: entry[nameField as keyof typeof entry] ?? entry.id,
        content_type: type,
      }));
    })
  );

  const pending = results.flat().sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return NextResponse.json({ data: pending, total: pending.length });
}
