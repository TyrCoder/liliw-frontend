import { NextRequest, NextResponse } from 'next/server';
import { requireStaffAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  if (!await requireStaffAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('participation_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[admin/participation GET]', error.code, error.message);
    return NextResponse.json({ success: false, data: [] });
  }

  // Deduplicate rows with identical email + message + date (keeps earliest id)
  const seen = new Set<string>();
  const deduped = (data || []).filter(row => {
    const day = row.created_at ? row.created_at.slice(0, 10) : '';
    const key = `${row.email}|${row.message}|${day}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ success: true, data: deduped });
}
